# Multi-Role Support Implementation

## Overview
Users can now have multiple roles (e.g., both student and mentor) instead of being limited to a single role.

## Database Changes

### Migration Required
Run the SQL migration in `/migrations/add_multi_role_support.sql`:

```sql
-- Add roles array column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY[]::text[];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- Migrate existing data
UPDATE public.profiles
SET roles = CASE
  WHEN role IS NOT NULL THEN ARRAY[role]::text[]
  ELSE ARRAY[]::text[]
END
WHERE roles = ARRAY[]::text[] OR roles IS NULL;
```

### Schema Changes
- **profiles.roles** (text[]): Array of roles the user has. Can include: 'student', 'mentor'
- **profiles.role** (text): Kept for backward compatibility, represents primary role

## API Changes

### Profile Creation (`/api/profile/create`)
- Now initializes `roles` as empty array
- Added `email` field to profile data
- Better error logging with detailed error information

### Student Onboarding (`/api/onboarding/student`)
- Adds 'student' to `roles` array
- Preserves existing roles (e.g., if user is already a mentor)
- Sets `role` to 'student' for backward compatibility

### Mentor Onboarding (`/api/onboarding/mentor`)
- Adds 'mentor' to `roles` array
- Preserves existing roles (e.g., if user is already a student)
- Sets `role` to 'mentor' for backward compatibility

## Helper Functions

New helper library at `/src/lib/roleHelpers.ts`:

```typescript
import { hasRole, getUserRoles, canAccessStudentFeatures, canAccessMentorFeatures } from '@/lib/roleHelpers'

// Check if user has a specific role
if (hasRole(profile, 'student')) {
  // User is a student
}

// Get all roles
const roles = getUserRoles(profile) // ['student', 'mentor']

// Check feature access
if (canAccessMentorFeatures(profile)) {
  // Show mentor dashboard
}
```

## Usage Examples

### Allow Student to Become Mentor
1. Student completes student onboarding → `roles: ['student']`
2. Student applies to be a mentor
3. After approval, student completes mentor onboarding → `roles: ['student', 'mentor']`
4. User can now access both student and mentor features

### Dashboard Role Switching
Users with multiple roles should see a role switcher in the dashboard to toggle between student and mentor views.

## Backward Compatibility
- The `role` field is maintained for backward compatibility
- It represents the user's "primary" role
- Existing code checking `profile.role` will continue to work
- New code should use `hasRole()` or `getUserRoles()` from roleHelpers

## Migration Path
1. ✅ Run database migration to add `roles` column
2. ✅ Update onboarding APIs to populate `roles` array
3. ✅ Create role helper functions
4. 🔄 Update UI components to use role helpers
5. 🔄 Add role switcher to dashboard
6. 🔄 Update authorization checks to use `hasRole()`
7. 🔄 Eventually deprecate `role` field once all code is migrated

## Testing
- Test student onboarding → verify `roles: ['student']`
- Test mentor onboarding → verify `roles: ['mentor']`
- Test student becoming mentor → verify `roles: ['student', 'mentor']`
- Test mentor becoming student → verify `roles: ['mentor', 'student']`
- Test role-based feature access with helper functions
