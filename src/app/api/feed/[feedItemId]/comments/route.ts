import { getAuthenticatedUser, isErrorResponse, isValidUUID, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ feedItemId: string }> }
) {
  try {
    const { feedItemId } = await params;
    if (!isValidUUID(feedItemId)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { data } = await supabaseAdmin
      .from('feed_comments')
      .select('*, author:profiles(id, username, avatar_url)')
      .eq('feed_item_id', feedItemId)
      .order('created_at', { ascending: true })
      .limit(50);

    return Response.json(data ?? []);
  } catch (error) {
    return handleApiError(error, 'feed.comments.GET');
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ feedItemId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const { feedItemId } = await params;
    if (!isValidUUID(feedItemId)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string' || content.length > 500) {
      return Response.json({ error: 'Commentaire invalide' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('feed_comments')
      .insert({ user_id: auth.profileId, feed_item_id: feedItemId, content })
      .select('*, author:profiles(id, username, avatar_url)')
      .single();

    if (error) return handleApiError(error, 'feed.comments.POST');
    return Response.json(data);
  } catch (error) {
    return handleApiError(error, 'feed.comments.POST');
  }
}
