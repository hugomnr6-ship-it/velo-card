import { getAuthenticatedUser, isErrorResponse, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const [profile, stats, activities, duels, badges, clubs, history, notifications] =
      await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', auth.profileId).single(),
        supabaseAdmin.from('user_stats').select('*').eq('user_id', auth.profileId).single(),
        supabaseAdmin.from('strava_activities').select('*').eq('user_id', auth.profileId),
        supabaseAdmin.from('duels').select('*').or(`challenger_id.eq.${auth.profileId},opponent_id.eq.${auth.profileId}`),
        supabaseAdmin.from('user_badges').select('*').eq('user_id', auth.profileId),
        supabaseAdmin.from('club_members').select('*, club:clubs(*)').eq('user_id', auth.profileId),
        supabaseAdmin.from('stats_history').select('*').eq('user_id', auth.profileId),
        supabaseAdmin.from('notifications').select('*').eq('user_id', auth.profileId),
      ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: profile.data,
      stats: stats.data,
      activities: activities.data ?? [],
      duels: duels.data ?? [],
      badges: badges.data ?? [],
      clubs: clubs.data ?? [],
      statsHistory: history.data ?? [],
      notifications: notifications.data ?? [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="velocard-export-${auth.profileId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'profile.export');
  }
}
