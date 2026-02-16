import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { updateWarProgressForUser } from "@/lib/wars";

export async function POST() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    await updateWarProgressForUser(profileId);

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "WARS_UPDATE");
  }
}
