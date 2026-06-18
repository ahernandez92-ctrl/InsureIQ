import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.SUPABASE_ANON_KEY");
}

// Client for general use (client-side or public server-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations that bypass RLS (like storage uploads)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
