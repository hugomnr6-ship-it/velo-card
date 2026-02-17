import { getAuthenticatedUser, isErrorResponse, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq('read', false);

    const { data, count, error } = await query;
    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return Response.json({ notifications: [], unreadCount: 0 });
      }
      return handleApiError(error, 'notifications.GET');
    }

    return Response.json({ notifications: data ?? [], unreadCount: count ?? 0 });
  } catch (error) {
    return handleApiError(error, 'notifications.GET');
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const { notificationIds, markAllRead } = await req.json();

    if (markAllRead) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', auth.profileId)
        .eq('read', false);
    } else if (notificationIds?.length) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('user_id', auth.profileId);
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'notifications.PATCH');
  }
}
