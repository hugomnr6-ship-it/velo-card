import { supabaseAdmin } from '@/lib/supabase';

type NotificationType =
  | 'duel_challenge' | 'duel_result' | 'badge_unlocked'
  | 'monday_reveal' | 'club_invite' | 'race_result'
  | 'weekly_recap' | 'tier_change' | 'quest_completed';

interface CreateNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(notification: CreateNotification) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  });
  if (error) console.error('[Notification] Error:', error);
}

export async function createBatchNotifications(notifications: CreateNotification[]) {
  const rows = notifications.map((n) => ({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data || {},
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin.from('notifications').insert(batch);
    if (error) console.error(`[Notification] Batch error at ${i}:`, error);
  }
}
