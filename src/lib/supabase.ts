import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Falls back to placeholder values so createClient never throws at module
// load time -- that would crash the whole app to a blank white screen
// before React even renders. Real queries still fail cleanly afterward,
// caught by each page's try/catch, with isSupabaseConfigured telling the
// UI whether the cause is "no .env yet" vs. an actual query error.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
