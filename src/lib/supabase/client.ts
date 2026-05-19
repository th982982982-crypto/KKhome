import { createBrowserClient } from '@supabase/ssr'

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.replace(/\/(rest|auth|storage)\/v\d.*$/, '').replace(/\/$/, '')
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
