# Stripe Payment Testing Checklist

## Pre-Testing Setup

### 1. Environment Variables
- [ ] `STRIPE_SECRET_KEY` is set in `.env.local`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `.env.local`
- [ ] `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3000`
- [ ] `RESEND_API_KEY` is set (for emails)

### 2. Stripe CLI Setup
```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Start webhook forwarding (keep this running in a separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Start Development Server
```bash
npm run dev
```

## Testing Flow

### Test 1: Successful Payment

**Steps:**
1. [ ] Navigate to `/coaches` page
2. [ ] Select a coach with a price set
3. [ ] Click "Book Session"
4. [ ] Select a date
5. [ ] Select a time slot
6. [ ] Select duration (1 hour minimum)
7. [ ] Fill in contact details
8. [ ] Review booking summary
9. [ ] Click "Confirm & Pay"
10. [ ] Verify redirect to Stripe checkout page
11. [ ] Use test card: `4242 4242 4242 4242`
12. [ ] Expiry: `12/34`, CVC: `123`, ZIP: `12345`
13. [ ] Complete payment

**Expected Results:**
- [ ] Redirected to `/booking-success` page
- [ ] Success message displayed
- [ ] Terminal shows webhook received
- [ ] Booking created in Supabase `bookings` table
- [ ] Booking status is `pending`
- [ ] `stripe_payment_intent_id` is saved
- [ ] Student receives confirmation email
- [ ] Coach receives booking request email
- [ ] Admin (`tryelevait@gmail.com`) receives notification
- [ ] Booking appears in `/student/sessions`
- [ ] Booking appears in coach's `/mentor/sessions` (pending section)

### Test 2: Payment Declined

**Steps:**
1. [ ] Start booking flow again
2. [ ] Use declined test card: `4000 0000 0000 0002`
3. [ ] Try to complete payment

**Expected Results:**
- [ ] Payment declined by Stripe
- [ ] Error message shown on Stripe checkout
- [ ] No booking created in database
- [ ] No emails sent
- [ ] User can try again with different card

### Test 3: Payment Cancelled

**Steps:**
1. [ ] Start booking flow
2. [ ] Get to Stripe checkout page
3. [ ] Click "Back" or close the page

**Expected Results:**
- [ ] Redirected to `/booking-cancelled` page
- [ ] Cancellation message displayed
- [ ] No booking created
- [ ] No charge made
- [ ] No emails sent

### Test 4: Price Calculation

**Test different durations:**
- [ ] 1 hour session: Price = coach's hourly rate
- [ ] 1.5 hour session: Price = hourly rate × 1.5
- [ ] 2 hour session: Price = hourly rate × 2

**Verify:**
- [ ] Correct amount shown on Stripe checkout
- [ ] Amount matches coach's `price_cents` × duration

### Test 5: Email Notifications

**After successful payment, verify emails contain:**

**Student Email:**
- [ ] Booking confirmation message
- [ ] Coach name
- [ ] Date and time
- [ ] Duration
- [ ] Session notes (if provided)
- [ ] "Awaiting coach approval" message
- [ ] Contact email: `tryelevait@gmail.com`

**Coach Email:**
- [ ] New booking request notification
- [ ] Student name
- [ ] Date and time
- [ ] Duration
- [ ] Session notes (if provided)
- [ ] Approve/Decline buttons (or instructions)

**Admin Email:**
- [ ] Booking notification
- [ ] Student and coach names
- [ ] Date, time, duration
- [ ] Reply-to: student's email

### Test 6: Webhook Handling

**Monitor terminal logs for:**
- [ ] `checkout.session.completed` event received
- [ ] Booking metadata extracted correctly
- [ ] `create_booking` RPC called successfully
- [ ] Booking ID returned
- [ ] `stripe_payment_intent_id` updated
- [ ] Email sending logs show success
- [ ] No errors in webhook handler

### Test 7: Edge Cases

**Test with missing coach price:**
- [ ] Try booking a coach with no `price_cents` set
- [ ] Should show error before reaching payment

**Test with invalid time slot:**
- [ ] Try booking a slot that's already taken
- [ ] Should prevent checkout session creation

**Test with past date:**
- [ ] Try booking a date in the past
- [ ] Should be blocked by validation

## Troubleshooting

### Webhook Not Working
```bash
# Check if Stripe CLI is running
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook secret matches
echo $STRIPE_WEBHOOK_SECRET
```

### Booking Not Created
- Check Supabase logs
- Verify `create_booking` function exists
- Check webhook handler logs in terminal

### Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery status
- Look for email errors in webhook logs

### Payment Succeeds But Redirect Fails
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that `/booking-success` and `/booking-cancelled` pages exist
- Look for console errors in browser

## Production Testing

Before going live:
- [ ] Test with live Stripe keys in test mode
- [ ] Set up production webhook endpoint
- [ ] Test with real card (small amount)
- [ ] Verify production emails are sent correctly
- [ ] Test refund process manually in Stripe Dashboard

## Test Cards Reference

**Successful payments:**
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

**Declined:**
- `4000 0000 0000 0002` - Generic decline
- `4000 0000 0000 9995` - Insufficient funds

**More test cards:** https://stripe.com/docs/testing

## Success Criteria

All tests pass when:
- ✅ Payments process successfully
- ✅ Bookings created in database
- ✅ Emails sent to all parties
- ✅ Correct amounts charged
- ✅ Webhooks handled properly
- ✅ Error cases handled gracefully
- ✅ User experience is smooth
