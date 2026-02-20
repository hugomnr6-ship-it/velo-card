import { getAuthenticatedUser, isErrorResponse, isValidUUID } from "@/lib/api-utils";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const { raceId } = await params;
  if (!isValidUUID(raceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "Clé API Gemini non configurée" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  let mimeType = file.type;
  if (!mimeType || mimeType === "application/octet-stream") {
    if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
    else if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (file.name.endsWith(".png")) mimeType = "image/png";
    else if (file.name.endsWith(".webp")) mimeType = "image/webp";
  }

  const prompt = `Tu es un assistant spécialisé dans l'extraction de listes d'engagés (start lists) de courses de vélo.

Analyse cette image/document et extrais TOUS les coureurs inscrits visibles.

Pour chaque coureur, extrais :
- rider_name : le nom complet du coureur (NOM Prénom)
- bib_number : le numéro de dossard si visible (sinon null)
- club : le nom du club/équipe si visible (sinon null)
- category : la catégorie si visible (sinon null)

REGLES :
- Ne retourne QUE le JSON, sans aucun texte autour ni backticks markdown
- Garde les noms tels quels (avec accents, majuscules, etc.)
- Si le nom est en MAJUSCULES, garde-le en MAJUSCULES
- Extrais TOUS les coureurs, même s'il y en a beaucoup
- Si un coureur apparaît plusieurs fois, ne le compte qu'une fois
- Retourne un objet JSON au format :
{"riders":[{"rider_name":"DUPONT Jean","bib_number":42,"club":"VC Montpellier","category":"Elite"},{"rider_name":"MARTIN Marie","bib_number":null,"club":null,"category":null}]}

Si tu ne trouves AUCUN coureur, retourne : {"riders":[]}`;

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
      maxOutputTokens: 8192,
    },
  });

  let lastError = "";
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[OCR-startlist] Trying Gemini model: ${model}`);
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

        if (errCode === 429) {
          lastError = "quota";
          continue;
        }
        lastError = errMsg;
        break;
      }

      const geminiData = await geminiRes.json();
      const textResponse =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
          { error: "Impossible de lire la liste des engagés" },
          { status: 422 },
        );
      }

      const ridersList = Array.isArray(parsed) ? parsed : parsed?.riders || [];

      const riders = ridersList
        .map((item: any) => ({
          rider_name: String(item.rider_name || "").trim(),
          bib_number: item.bib_number ? Number(item.bib_number) : null,
          club: item.club ? String(item.club).trim() : null,
          category: item.category ? String(item.category).trim() : null,
        }))
        .filter((r: any) => r.rider_name.length > 0);

      // Deduplicate by name
      const seen = new Set<string>();
      const deduped = riders.filter((r: any) => {
        const key = r.rider_name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      console.log(`[OCR-startlist] ${model} success: ${deduped.length} riders extracted`);
      return Response.json({ riders: deduped });
    } catch (err) {
      console.error(`Gemini ${model} network error:`, err);
      lastError = "network";
      continue;
    }
  }

  if (lastError === "quota") {
    return Response.json(
      { error: "Quota API Gemini épuisé. Réessaie dans quelques minutes." },
      { status: 429 },
    );
  }

  return Response.json(
    { error: "Erreur de l'API d'analyse d'image" },
    { status: 502 },
  );
}
