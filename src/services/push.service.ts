import { supabaseAdmin } from "@/lib/supabase";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  // Dynamic import web-push to avoid issues in edge runtime
  const webpush = await import("web-push");
  webpush.setVapidDetails(
    "mailto:contact@velocard.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        JSON.stringify(payload),
      ),
    ),
  );

  // Clean up expired subscriptions
  const expired = results
    .map((r, i) => (r.status === "rejected" ? subscriptions[i].id : null))
    .filter(Boolean);

  if (expired.length) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", expired);
  }
}

export async function sendPushToAll(payload: PushPayload) {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*");

  if (!subscriptions?.length) return;

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    "mailto:contact@velocard.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        JSON.stringify(payload),
      ),
    ),
  );
}
