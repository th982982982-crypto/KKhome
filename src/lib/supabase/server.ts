import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch { /* ignore in Server Components */ }
      },
    },
  })
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  const { url, serviceKey } = getConfig()

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch { /* ignore in Server Components */ }
      },
    },
  })
}
