# Profile Update Fixes - Summary

## Issues Fixed

### Issue 1: Apostrophes Converting to `&#x27;`
**Problem:** Text fields like `aboutMe` and `shortDescription` were being HTML-encoded when saved, converting apostrophes (`'`) to `&#x27;`, quotes to `&quot;`, and slashes to `&#x2F;`.

**Root Cause:** The `sanitizeText()` function was HTML-encoding all text before saving to the database. This caused:
- Apostrophes to become `&#x27;`
- Character count inflation (validation failures)
- Poor user experience with encoded text

**Solution:**
- Created `sanitizeTextNoEncode()` function in `@/lib/sanitization.ts` that trims and validates without HTML encoding
- Updated API routes to use `sanitizeTextNoEncode()` for long-form text fields:
  - `about_me`
  - `short_description`
  - `payment_description`
- Created `sanitizeStringArrayNoEncode()` for arrays like `specializations` and `session_types`

**Files Changed:**
- `src/lib/sanitization.ts` - Added new sanitization functions
- `src/app/api/mentor/profile/route.ts` - Use no-encode functions for text fields
- `src/app/api/onboarding/coach-application/route.ts` - Use no-encode functions for text fields

### Issue 2: Validation Errors Not User-Friendly
**Problem:** When validation failed, users only saw "Validation failed" without knowing which field or why.

**Solution:**
- Enhanced `handleValidationError()` in `@/lib/securityUtils.ts` to provide:
  - `field`: The field name that failed
  - `code`: Error type (`too_long`, `too_short`, `invalid_format`, etc.)
  - `message`: Human-readable message (e.g., "about_me must be at most 2000 characters")
- Updated frontend (`src/app/mentor/settings/page.tsx`) to display field-specific errors

**Example Error Response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "about_me",
      "code": "too_long",
      "message": "about_me must be at most 2000 characters"
    }
  ]
}
```

### Issue 3: Existing Data Had HTML Entities
**Problem:** Profiles saved before the fix contained encoded text.

**Solution:**
- Created `scripts/fix-text-encoding.ts` migration script
- Ran script to decode all existing `about_me`, `short_description`, and `payment_description` fields
- Fixed 1 mentor profile with encoded apostrophes

## Validation Schema Limits

Current limits in `updateMentorProfileSchema`:
- `about_me`: 50-2000 characters
- `short_description`: 10-500 characters
- `payment_description`: max 500 characters
- `specializations`: max 10 items, 50 chars each
- `session_types`: max 10 items, 50 chars each

## How It Works Now

### Saving Text
1. User enters text with apostrophes, quotes, etc.
2. Backend receives text and validates length
3. `sanitizeTextNoEncode()` trims and validates WITHOUT encoding
4. Plain text is stored in database (e.g., "I'm helping students")
5. React automatically escapes on render (XSS protection)

### Error Messages
1. If validation fails, API returns detailed error with field, code, and message
2. Frontend displays: "Failed to update some settings. Profile: about_me must be at most 2000 characters."
3. Console logs full error details for debugging

## Testing

To test the fixes:

1. **Update profile with apostrophes:**
   - Go to Mentor Settings
   - Add text with apostrophes: "I'm a product manager who's helped..."
   - Save and verify it displays correctly (not as `&#x27;`)

2. **Test validation errors:**
   - Try to save `about_me` with < 50 characters
   - Should see: "about_me must be at least 50 characters"
   - Try to save `about_me` with > 2000 characters
   - Should see: "about_me must be at most 2000 characters"

3. **Test specializations:**
   - Select "B2B/Enterprise" and "Data/Analytics PM"
   - Save and verify they display correctly (not encoded)

## Migration Scripts

Two scripts were created and run:

1. **`scripts/fix-specializations.ts`**
   - Fixed HTML-encoded specializations
   - Removed duplicates
   - Fixed 2 mentor profiles

2. **`scripts/fix-text-encoding.ts`**
   - Fixed HTML-encoded text in aboutMe, shortDescription, paymentDescription
   - Fixed 1 mentor profile

Both scripts can be re-run safely if needed:
```bash
npx tsx scripts/fix-specializations.ts
npx tsx scripts/fix-text-encoding.ts
```

## Key Principles for Future Development

1. **Never HTML-encode before saving to database** - Store plain UTF-8 text
2. **Let React handle escaping on render** - Automatic XSS protection
3. **Use `sanitizeTextNoEncode()` for user-facing text fields** - aboutMe, descriptions, etc.
4. **Use `sanitizeText()` only for short identifiers** - titles, names (where encoding is acceptable)
5. **Always provide field-specific error messages** - Include field, code, and message
6. **Decode legacy data on read if needed** - Handle existing encoded data gracefully

## Files Modified

### Core Libraries
- `src/lib/sanitization.ts` - Added no-encode functions
- `src/lib/securityUtils.ts` - Enhanced error handling

### API Routes
- `src/app/api/mentor/profile/route.ts` - Fixed text encoding
- `src/app/api/onboarding/coach-application/route.ts` - Fixed text encoding

### Frontend
- `src/app/mentor/settings/page.tsx` - Better error display
- `src/app/coaches/page.tsx` - Decode HTML entities in specializations

### Migration Scripts
- `scripts/fix-specializations.ts` - Clean specializations
- `scripts/fix-text-encoding.ts` - Clean text fields

## Status

✅ All issues fixed
✅ Migration scripts run successfully
✅ Existing data cleaned
✅ Future saves will work correctly
✅ Error messages are user-friendly

The profile update functionality should now work correctly without HTML encoding issues.
