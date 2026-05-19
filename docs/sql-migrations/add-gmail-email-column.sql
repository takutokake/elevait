-- ============================================================
-- Migration: Fix Gmail connection — add gmail_email column
-- and ensure RLS policies exist on user_oauth_tokens
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Add the missing gmail_email column (root cause of store_failed error)
ALTER TABLE public.user_oauth_tokens
ADD COLUMN IF NOT EXISTS gmail_email TEXT;

-- 2. Ensure RLS is enabled
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Authenticated users can read/write their own tokens (needed for client-side storeOAuthTokens)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_oauth_tokens'
      AND policyname = 'Users can manage their own OAuth tokens'
  ) THEN
    CREATE POLICY "Users can manage their own OAuth tokens"
      ON public.user_oauth_tokens
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Service role always bypasses RLS (no explicit policy needed)
--    but confirm the table structure is correct
COMMENT ON COLUMN public.user_oauth_tokens.gmail_email
  IS 'The Gmail address associated with this OAuth token (gmail provider only)';
