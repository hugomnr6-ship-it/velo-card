import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

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
    const path = `avatars/${profileId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) return handleApiError(uploadError, "PROFILE_AVATAR");

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
      .eq("id", profileId);

    return Response.json({ url: publicUrl });
  } catch (err) {
    return handleApiError(err, "PROFILE_AVATAR");
  }
}
