import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return Response.json({ error: "Aucun fichier" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Type de fichier non supporte (JPG, PNG, WebP)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 });
    }

    const ext = file.type.split("/")[1];
    const path = `avatars/${profile.id}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from("avatars")
      .getPublicUrl(path);

    const publicUrl = publicUrlData.publicUrl;

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ custom_avatar_url: publicUrl })
      .eq("id", profile.id);

    return Response.json({ url: publicUrl });
  } catch (err: any) {
    return Response.json({ error: err.message || "Erreur upload" }, { status: 500 });
  }
}
