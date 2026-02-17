import { handleApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { runMondayUpdate } from "@/services/monday-update.service";

export const maxDuration = 300; // 5 minutes max

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn("Monday Update: unauthorized access attempt");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("Monday Update CRON triggered");
    const result = await runMondayUpdate();
    logger.info("Monday Update CRON completed", result);
    return Response.json(result);
  } catch (err) {
    logger.error("Monday Update CRON failed", { error: String(err) });
    return handleApiError(err, "MONDAY_UPDATE");
  }
}
