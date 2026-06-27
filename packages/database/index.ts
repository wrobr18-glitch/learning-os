import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Expose standard public client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Expose secure admin client (bypasses RLS - server-side ONLY)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export * from "@supabase/supabase-js";
export * from "./embeddings";
export * from "./memory";
