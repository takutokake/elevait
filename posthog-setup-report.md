# PostHog Post-Wizard Report

The wizard has completed a deep integration of PostHog analytics into your Elevait coaching platform. This integration includes automatic pageview tracking, client-side event capture for user interactions, server-side event capture for critical business operations, and user identification for cross-session analytics.

## Integration Summary

### Files Created
| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | PostHog client initialization with exception capture |
| `src/lib/posthog-server.ts` | Server-side PostHog client for API routes |

### Files Modified
| File | Changes |
|------|---------|
| `next.config.ts` | Added reverse proxy rewrites for `/ingest` routes |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Events Tracked

| Event Name | Description | File(s) |
|------------|-------------|---------|
| `user_signed_up` | User creates a new account (email or Google OAuth) | `src/app/(auth)/signup/page.tsx` |
| `user_logged_in` | User logs in with email/password or Google OAuth | `src/app/(auth)/login/page.tsx` |
| `student_onboarding_completed` | Student completes their profile onboarding | `src/app/onboarding/student/page.tsx` |
| `coach_application_submitted` | User submits application to become a coach | `src/app/mentor/apply/page.tsx` |
| `mentor_saved` | Student saves/bookmarks a mentor | `src/components/BookmarkButton.tsx` |
| `mentor_unsaved` | Student removes a mentor from saved list | `src/components/BookmarkButton.tsx` |
| `booking_session_type_selected` | User selects free or paid session type | `src/components/BookingModal.tsx` |
| `booking_confirmed_free` | User confirms a free coaching session | `src/components/BookingModal.tsx` |
| `booking_payment_initiated` | User proceeds to Stripe checkout | `src/components/BookingModal.tsx` |
| `post_session_survey_submitted` | Mentor submits post-session survey | `src/components/PostSessionSurveyModal.tsx` |
| `checkout_session_created` | Server creates Stripe checkout session | `src/app/api/create-checkout-session/route.ts` |
| `payment_completed` | Stripe webhook confirms successful payment | `src/app/api/webhooks/stripe/route.ts` |
| `free_booking_created` | Server creates a free session booking | `src/app/api/bookings/route.ts` |
| `booking_approved` | Coach approves a pending booking request | `src/app/api/bookings/[id]/approve/route.ts` |

## User Identification

Users are identified with PostHog using their Supabase user ID on:
- Signup (with email, name, and role)
- Login (with email)

This enables tracking user journeys across sessions and devices.

## Next Steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- **Analytics Basics**: [https://us.posthog.com/project/249235/dashboard/1266938](https://us.posthog.com/project/249235/dashboard/1266938)

### Insights
- **User Signups & Logins**: [https://us.posthog.com/project/249235/insights/7523cIBr](https://us.posthog.com/project/249235/insights/7523cIBr)
- **Student Conversion Funnel**: [https://us.posthog.com/project/249235/insights/MI1dFnCQ](https://us.posthog.com/project/249235/insights/MI1dFnCQ)
- **Booking Activity**: [https://us.posthog.com/project/249235/insights/v8F19t37](https://us.posthog.com/project/249235/insights/v8F19t37)
- **Coach Application Funnel**: [https://us.posthog.com/project/249235/insights/698QMv6j](https://us.posthog.com/project/249235/insights/698QMv6j)
- **Mentor Engagement**: [https://us.posthog.com/project/249235/insights/IKXYrYge](https://us.posthog.com/project/249235/insights/IKXYrYge)

### Agent Skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Environment Variables

Make sure your production environment has these variables set:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_AceszSqia3eenkffN6C9k1h7CPbTNXJknxSnenWOVJ2
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
