import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export async function signInOwner(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOutOwner() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// A logged-in Supabase Auth user is not automatically an "owner" -- that
// only means they have a row in the owners table. This mirrors exactly
// what the RLS policies check server-side, so the UI's view of "am I an
// owner" never disagrees with what the database actually enforces.
export async function checkIsOwner(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('owners').select('id').eq('id', userId).maybeSingle()
  if (error) throw error
  return data !== null
}
