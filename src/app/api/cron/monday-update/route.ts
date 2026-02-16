import { handleApiError } from "@/lib/api-utils";
import { runMondayUpdate } from "@/services/monday-update.service";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMondayUpdate();
    return Response.json(result);
  } catch (err) {
    return handleApiError(err, "MONDAY_UPDATE");
  }
}
