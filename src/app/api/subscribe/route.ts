import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Email invalide' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('email_subscribers')
      .upsert({ email: parsed.data.email }, { onConflict: 'email' });

    if (error) {
      console.error('[Subscribe] Error:', error);
      return Response.json({ error: 'Erreur' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Erreur' }, { status: 500 });
  }
}
