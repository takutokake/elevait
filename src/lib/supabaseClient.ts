'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// If I have Database types I can add them later, but keep it untyped for now.
export function getSupabaseBrowserClient() {
  return createClientComponentClient();
}
