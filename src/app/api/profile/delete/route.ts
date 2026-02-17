import { getAuthenticatedUser, isErrorResponse, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE() {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const userId = auth.profileId;

    // Delete user data (CASCADE handles most, but be explicit)
    await Promise.all([
      supabaseAdmin.from('notifications').delete().eq('user_id', userId),
      supabaseAdmin.from('user_badges').delete().eq('user_id', userId),
      supabaseAdmin.from('club_members').delete().eq('user_id', userId),
      supabaseAdmin.from('stats_history').delete().eq('user_id', userId),
      supabaseAdmin.from('strava_activities').delete().eq('user_id', userId),
      supabaseAdmin.from('user_feedback').delete().eq('user_id', userId),
      supabaseAdmin.from('feed_likes').delete().eq('user_id', userId),
      supabaseAdmin.from('feed_comments').delete().eq('user_id', userId),
    ]);

    // Anonymize duels (preserve data integrity)
    await supabaseAdmin.from('duels').update({ challenger_id: null }).eq('challenger_id', userId);
    await supabaseAdmin.from('duels').update({ opponent_id: null }).eq('opponent_id', userId);

    // Delete stats and profile
    await supabaseAdmin.from('user_stats').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'profile.delete');
  }
}
