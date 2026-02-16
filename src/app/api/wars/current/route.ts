import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { getWarDashboardForUser } from "@/services/war.service";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const dashboard = await getWarDashboardForUser(auth.profileId);
    return Response.json(dashboard);
  } catch (err) {
    return handleApiError(err, "WARS_CURRENT");
  }
}
