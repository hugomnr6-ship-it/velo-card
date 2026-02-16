import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createClubSchema } from "@/schemas";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();

  let query = supabaseAdmin
    .from("clubs")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: clubs, error } = await query;
  if (error) return handleApiError(error, "CLUBS_GET");

  // Get member counts
  const clubIds = (clubs || []).map((c: any) => c.id);
  const { data: members } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .in("club_id", clubIds.length > 0 ? clubIds : ["none"]);

  const countMap: Record<string, number> = {};
  for (const m of members || []) {
    countMap[m.club_id] = (countMap[m.club_id] || 0) + 1;
  }

  // Get current user's club memberships
  let userClubIds: string[] = [];
  const { data: userMemberships } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", profileId);
  userClubIds = (userMemberships || []).map((m: any) => m.club_id);

  const result = (clubs || []).map((c: any) => ({
    ...c,
    member_count: countMap[c.id] || 0,
  }));

  return Response.json({ clubs: result, userClubIds });
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const formData = await request.formData();
  const rawName = (formData.get("name") as string)?.trim();
  const logo = formData.get("logo") as File | null;

  const nameValidated = validateBody(createClubSchema, { name: rawName });
  if (nameValidated instanceof Response) return nameValidated;
  const name = nameValidated.name;

  if (!logo || !logo.type.startsWith("image/")) {
    return Response.json(
      { error: "Une photo du maillot est requise" },
      { status: 400 },
    );
  }
  if (logo.size > 2 * 1024 * 1024) {
    return Response.json(
      { error: "L'image ne doit pas depasser 2 Mo" },
      { status: 400 },
    );
  }

  // Upload logo to Supabase Storage
  const ext = logo.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await logo.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("club-logos")
    .upload(fileName, buffer, { contentType: logo.type, upsert: false });

  if (uploadError) return handleApiError(uploadError, "CLUBS_POST_UPLOAD");

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("club-logos")
    .getPublicUrl(fileName);
  const logoUrl = publicUrlData.publicUrl;

  // Insert club
  const { data: club, error: clubError } = await supabaseAdmin
    .from("clubs")
    .insert({ name, logo_url: logoUrl, creator_id: profileId })
    .select()
    .single();

  if (clubError) {
    if (clubError.code === "23505") {
      return Response.json(
        { error: "Un club avec ce nom existe deja" },
        { status: 409 },
      );
    }
    return handleApiError(clubError, "CLUBS_POST");
  }

  // Auto-join creator
  await supabaseAdmin
    .from("club_members")
    .insert({ club_id: club.id, user_id: profileId });

  return Response.json(club, { status: 201 });
}
