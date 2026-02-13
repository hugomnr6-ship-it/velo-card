import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

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
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

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
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  let userClubIds: string[] = [];
  if (profile) {
    const { data: userMemberships } = await supabaseAdmin
      .from("club_members")
      .select("club_id")
      .eq("user_id", profile.id);
    userClubIds = (userMemberships || []).map((m: any) => m.club_id);
  }

  const result = (clubs || []).map((c: any) => ({
    ...c,
    member_count: countMap[c.id] || 0,
  }));

  return Response.json({ clubs: result, userClubIds });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const logo = formData.get("logo") as File | null;

  if (!name) {
    return Response.json(
      { error: "Le nom du club est requis" },
      { status: 400 },
    );
  }
  if (name.length > 50) {
    return Response.json(
      { error: "Le nom ne peut pas depasser 50 caracteres" },
      { status: 400 },
    );
  }
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

  // Get profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Upload logo to Supabase Storage
  const ext = logo.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await logo.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("club-logos")
    .upload(fileName, buffer, { contentType: logo.type, upsert: false });

  if (uploadError) {
    return Response.json(
      { error: "Erreur upload logo: " + uploadError.message },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("club-logos")
    .getPublicUrl(fileName);
  const logoUrl = publicUrlData.publicUrl;

  // Insert club
  const { data: club, error: clubError } = await supabaseAdmin
    .from("clubs")
    .insert({ name, logo_url: logoUrl, creator_id: profile.id })
    .select()
    .single();

  if (clubError) {
    if (clubError.code === "23505") {
      return Response.json(
        { error: "Un club avec ce nom existe deja" },
        { status: 409 },
      );
    }
    return Response.json({ error: clubError.message }, { status: 500 });
  }

  // Auto-join creator
  await supabaseAdmin
    .from("club_members")
    .insert({ club_id: club.id, user_id: profile.id });

  return Response.json(club, { status: 201 });
}
