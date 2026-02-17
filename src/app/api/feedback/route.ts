import { getAuthenticatedUser, isErrorResponse, handleApiError } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'other']),
  message: z.string().min(10).max(2000),
  pageUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (isErrorResponse(auth)) return auth;

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('user_feedback').insert({
      user_id: auth.profileId,
      type: parsed.data.type,
      message: parsed.data.message,
      page_url: parsed.data.pageUrl,
      user_agent: req.headers.get('user-agent'),
    });

    if (error) return handleApiError(error, 'feedback.POST');
    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'feedback.POST');
  }
}
