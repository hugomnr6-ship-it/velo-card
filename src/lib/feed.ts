import { supabaseAdmin } from "@/lib/supabase";

/**
 * Insert a feed event (fire-and-forget).
 * Errors are silently caught — feed is never critical.
 */
export async function insertFeedEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabaseAdmin
      .from("activity_feed")
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
      });
  } catch {
    // Silently ignore — feed is non-critical
  }
}
