import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Public client — singleton
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
  return supabaseInstance;
})();

// Admin client — singleton (for API routes)
let supabaseAdminInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const supabaseAdmin = (() => {
  if (supabaseAdminInstance) return supabaseAdminInstance;
  supabaseAdminInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );
  return supabaseAdminInstance;
})();
