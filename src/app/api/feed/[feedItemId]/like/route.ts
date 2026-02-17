import { getAuthenticatedUser, isErrorResponse, isValidUUID, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ feedItemId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const { feedItemId } = await params;
    if (!isValidUUID(feedItemId)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Toggle like
    const { data: existing } = await supabaseAdmin
      .from('feed_likes')
      .select('id')
      .eq('user_id', auth.profileId)
      .eq('feed_item_id', feedItemId)
      .single();

    if (existing) {
      await supabaseAdmin.from('feed_likes').delete().eq('id', existing.id);
      return Response.json({ liked: false });
    } else {
      await supabaseAdmin.from('feed_likes').insert({
        user_id: auth.profileId,
        feed_item_id: feedItemId,
      });
      return Response.json({ liked: true });
    }
  } catch (error) {
    return handleApiError(error, 'feed.like');
  }
}
