import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  // Vite client-side, Vite SSR, Node/Cloudflare process fallback
  const SUPABASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : undefined) ||
    '';

  const SUPABASE_PUBLISHABLE_KEY =
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY : undefined) ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY : undefined) ||
    '';

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      '[Supabase] Warning: Supabase URL or Publishable Key is missing in environment variables. Check Cloudflare/Vite configuration.'
    );
  }

  return createClient<Database>(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_PUBLISHABLE_KEY || 'placeholder-key', {
    global: {
      fetch: SUPABASE_PUBLISHABLE_KEY ? createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) : undefined,
    },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});