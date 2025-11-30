# Stripe Payment Integration Setup Guide

## Overview
This guide will help you set up Stripe payments for coaching session bookings on Elevait.

## Payment Flow
1. Student selects a coach and time slot
2. Student clicks "Confirm & Pay" → redirected to Stripe checkout
3. Student completes payment on Stripe's secure page
4. Stripe webhook creates the booking in Supabase
5. Confirmation emails sent to student, coach, and admin
6. Student redirected to success page

## Setup Steps

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Navigate to **Developers** → **API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Add Stripe Keys to Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change to your production URL in production
```

### 3. Set Up Stripe Webhook

Webhooks allow Stripe to notify your app when a payment is completed.

#### For Local Development (using Stripe CLI):

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) and add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

#### For Production:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen to:
   - `checkout.session.completed`
5. Copy the **Signing secret** and add it to your production environment variables

### 4. Test the Payment Flow

#### Using Stripe Test Mode:

Stripe provides test card numbers that simulate different scenarios:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment Declined:**
- Card: `4000 0000 0000 0002`

**More test cards:** https://stripe.com/docs/testing

#### Testing Steps:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Go to your app and try booking a session:
   - Browse coaches
   - Select a time slot
   - Fill in booking details
   - Click "Confirm & Pay"
   - Use test card `4242 4242 4242 4242`
   - Complete payment

4. Check the terminal logs to see:
   - Stripe checkout session created
   - Webhook received
   - Booking created in Supabase
   - Emails sent

### 5. Verify Everything Works

After a successful test payment, verify:

- ✅ Student redirected to `/booking-success` page
- ✅ Booking appears in Supabase `bookings` table with status `pending`
- ✅ `stripe_payment_intent_id` is saved in the booking
- ✅ Student receives confirmation email
- ✅ Coach receives booking request email
- ✅ Admin receives notification email
- ✅ Booking appears in student's "My Sessions" page
- ✅ Booking appears in coach's "Pending Bookings" for approval

### 6. Production Deployment

Before going live:

1. **Switch to Live Mode in Stripe Dashboard**
2. **Get your live API keys** (starts with `pk_live_` and `sk_live_`)
3. **Update production environment variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   NEXT_PUBLIC_SITE_URL=https://elevait.space
   ```
4. **Set up production webhook endpoint** (see step 3)
5. **Test with real card** (small amount first!)

## Troubleshooting

### Webhook Not Receiving Events

**Problem:** Payments complete but bookings aren't created.

**Solutions:**
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check webhook logs in Stripe Dashboard → Developers → Webhooks
- Look for errors in your terminal/server logs

### Payment Succeeds But Booking Fails

**Problem:** Payment goes through but booking doesn't appear.

**Solutions:**
- Check Supabase logs for errors
- Verify the `create_booking` function exists in Supabase
- Check that all required fields are being passed correctly
- Look at webhook handler logs in `/api/webhooks/stripe`

### Emails Not Sending

**Problem:** Booking created but no emails sent.

**Solutions:**
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery status
- Look for email errors in webhook logs
- Verify email addresses are valid

### Redirect URLs Not Working

**Problem:** After payment, redirect fails or goes to wrong page.

**Solutions:**
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that success/cancel pages exist at:
  - `/booking-success`
  - `/booking-cancelled`
- Ensure URLs in Stripe checkout session match your domain

## Important Notes

### Security
- ⚠️ **Never commit** `.env.local` to git
- ⚠️ **Never expose** `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the client
- ✅ Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should be public

### Pricing
- Coach prices are stored in cents in the `mentors` table (`price_cents`)
- Duration is calculated from booking start/end times
- Total charge = `price_cents * duration_in_hours`

### Booking Status Flow
1. **Payment completed** → Booking created with status `pending`
2. **Coach approves** → Status changes to `confirmed`
3. **Coach declines** → Status changes to `declined` (refund may be needed)
4. **Session cancelled** → Status changes to `cancelled` (refund may be needed)

### Refunds
Currently, refunds must be processed manually through the Stripe Dashboard. Future enhancement: Automatic refunds when bookings are declined/cancelled.

## Support

If you encounter issues:
1. Check the terminal logs for errors
2. Review Stripe Dashboard → Developers → Logs
3. Check Supabase logs
4. Verify all environment variables are set correctly

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
