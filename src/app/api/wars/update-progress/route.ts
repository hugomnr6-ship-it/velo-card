import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";
import { updateWarProgressForUser } from "@/lib/wars";

export async function POST() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    await updateWarProgressForUser(profileId);

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("War update error:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
