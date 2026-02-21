import { supabaseAdmin } from "./supabase";
import { logger } from "./logger";

export async function logAudit(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await supabaseAdmin.from("audit_log").insert({
      user_id: params.userId ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? {},
      ip_address: params.ipAddress ?? null,
    });
  } catch (error) {
    logger.error("[AUDIT] Failed to log", { error: String(error) });
  }
}
