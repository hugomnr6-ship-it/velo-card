import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Models to try in order (fallback chain)
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  // Verify creator
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const { data: race } = await supabaseAdmin
    .from("races")
    .select("creator_id")
    .eq("id", raceId)
    .single();

  if (!race || race.creator_id !== profile.id) {
    return Response.json(
      { error: "Seul le créateur peut importer des résultats" },
      { status: 403 },
    );
  }

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "Clé API Gemini non configurée" },
      { status: 500 },
    );
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "Fichier manquant" }, { status: 400 });
  }

  // Read file as base64
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  // Determine MIME type
  let mimeType = file.type;
  if (!mimeType || mimeType === "application/octet-stream") {
    if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
    else if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (file.name.endsWith(".png")) mimeType = "image/png";
    else if (file.name.endsWith(".webp")) mimeType = "image/webp";
  }

  const prompt = `Tu es un assistant spécialisé dans l'extraction de résultats de courses de vélo.

Analyse cette image/document et extrais TOUS les résultats de course visibles.

Pour chaque coureur, extrais :
- position : le numéro de classement (1, 2, 3...)
- rider_name : le nom complet du coureur
- finish_time_str : le temps d'arrivée au format H:MM:SS (sans zéro initial sur les heures)

EXTRAIS AUSSI les infos globales de la course si visibles :
- race_time_str : le temps du vainqueur ou temps de course au format H:MM:SS (ex: "122 km en 2h53'38"" → "2:53:38")
- avg_speed : la vitesse moyenne en km/h si visible (ex: "42.158 km/h" → 42.16). Mets 0 si non visible.

REGLES POUR LES TEMPS :
- Cherche les temps partout : à côté de chaque coureur, dans une colonne "temps", en haut du classement, dans un en-tête, etc.
- Le temps du vainqueur (1er) est souvent affiché en haut ou dans l'en-tête du classement (ex: "122 km en 2h53'38""). Convertis-le au format H:MM:SS (ex: "2:53:38").
- Les temps des autres coureurs peuvent être des écarts (ex: "+0'12"", "à 1'30""). Dans ce cas, mets l'écart tel quel comme temps, ou mets "" si tu ne peux pas le convertir proprement.
- Si un coureur n'a AUCUN temps visible nulle part (ni temps absolu, ni écart), mets une chaîne vide "".
- N'INVENTE JAMAIS de temps. Mets "" en cas de doute.

AUTRES REGLES :
- Ne retourne QUE le JSON, sans aucun texte autour ni backticks markdown
- Si la position n'est pas explicite, déduis-la de l'ordre d'apparition
- Garde les noms tels quels (avec accents, majuscules, etc.)
- Retourne un objet JSON au format :
{"race_time_str":"2:53:38","avg_speed":42.16,"results":[{"position":1,"rider_name":"Jean Dupont","finish_time_str":"2:53:38"},{"position":2,"rider_name":"Marie Martin","finish_time_str":""}]}

Si tu ne trouves AUCUN résultat de course, retourne : {"race_time_str":"","avg_speed":0,"results":[]}`;

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  // Try each model in the fallback chain
  let lastError = "";
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
      );

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => null);
        const errCode = errData?.error?.code;
        const errMsg = errData?.error?.message || "";
        console.error(`Gemini ${model} error (${errCode}):`, errMsg);

        // If rate limited, try next model
        if (errCode === 429) {
          lastError = "quota";
          continue;
        }

        // Other error — stop trying
        lastError = errMsg;
        break;
      }

      const geminiData = await geminiRes.json();
      const textResponse =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Parse the JSON response — Gemini might wrap in ```json ... ```
      let cleanJson = textResponse.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      }
      cleanJson = cleanJson.trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        console.error("Failed to parse Gemini response:", cleanJson);
        return Response.json(
          { error: "Impossible de lire les résultats du fichier" },
          { status: 422 },
        );
      }

      // Support both old format (array) and new format (object with results[])
      let resultsList: any[];
      let raceTimeStr = "";
      let avgSpeed = 0;

      if (Array.isArray(parsed)) {
        resultsList = parsed;
      } else if (parsed && Array.isArray(parsed.results)) {
        resultsList = parsed.results;
        raceTimeStr = String(parsed.race_time_str || "").trim();
        avgSpeed = Number(parsed.avg_speed) || 0;
      } else {
        return Response.json(
          { error: "Format de réponse inattendu" },
          { status: 422 },
        );
      }

      // Normalize and validate results
      const results = resultsList
        .map((item: any, index: number) => ({
          position: item.position || index + 1,
          rider_name: String(item.rider_name || "").trim(),
          finish_time_str: String(item.finish_time_str || "").trim(),
        }))
        .filter((r) => r.rider_name.length > 0);

      console.log(`Gemini ${model} success: ${results.length} results extracted`);
      return Response.json({ results, race_time_str: raceTimeStr, avg_speed: avgSpeed });
    } catch (err) {
      console.error(`Gemini ${model} network error:`, err);
      lastError = "network";
      continue;
    }
  }

  // All models failed
  if (lastError === "quota") {
    return Response.json(
      {
        error:
          "Quota API Gemini epuise. Reessaie dans quelques minutes ou verifie ton quota sur ai.google.dev",
      },
      { status: 429 },
    );
  }

  return Response.json(
    { error: "Erreur de l'API d'analyse d'image" },
    { status: 502 },
  );
}
