-- Migration: Add multi-role support to profiles table
-- This allows users to have multiple roles (e.g., both student and mentor)

-- Add roles array column (will eventually replace the single 'role' column)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY[]::text[];

-- Create index for roles array for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- Update existing profiles to populate roles array from current role field
-- This is a data migration to preserve existing role data
UPDATE public.profiles
SET roles = CASE
  WHEN role IS NOT NULL THEN ARRAY[role]::text[]
  ELSE ARRAY[]::text[]
END
WHERE roles = ARRAY[]::text[] OR roles IS NULL;

-- Add comment explaining the new field
COMMENT ON COLUMN public.profiles.roles IS 'Array of roles the user has. Can include: student, mentor. Users can have multiple roles.';

-- Note: We keep the 'role' column for backward compatibility during transition
-- Once all code is updated to use 'roles', we can deprecate the 'role' column
