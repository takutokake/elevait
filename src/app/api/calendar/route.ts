import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

/**
 * POST /api/calendar
 * Create a Google Calendar event with Google Meet for a booking
 * Body: { bookingId }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      )
    }

    console.log('[Calendar API] Creating calendar event for booking:', bookingId)

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, availability_slots(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('[Calendar API] Booking not found:', bookingError)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user is part of this booking
    if (booking.mentor_id !== user.id && booking.learner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get mentor and learner profiles separately
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.mentor_id)
      .single()

    const { data: learnerProfile, error: learnerError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.learner_id)
      .single()

    if (mentorError || !mentorProfile || learnerError || !learnerProfile) {
      console.error('[Calendar API] Failed to fetch profiles:', { mentorError, learnerError })
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      )
    }

    // Check if user has Google OAuth token with calendar scopes
    const { data: oauthTokens, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, refresh_token, provider_scopes, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !oauthTokens?.access_token) {
      console.log('[Calendar API] No OAuth token found for user')
      return NextResponse.json(
        { error: 'Google OAuth token not found', needsAuth: true },
        { status: 401 }
      )
    }

    // Check if token is expired
    const expiresAt = new Date(oauthTokens.expires_at)
    if (expiresAt < new Date()) {
      console.log('[Calendar API] Token is expired')
      // TODO: Implement token refresh using refresh_token
      return NextResponse.json(
        { error: 'Google OAuth token expired', needsAuth: true },
        { status: 401 }
      )
    }

    console.log('[Calendar API] Creating Google Calendar event')

    // Create Google Calendar event
    const calendarEventData = {
      summary: `Elevait Session: ${mentorProfile.full_name} & ${learnerProfile.full_name}`,
      description: booking.session_notes || 'Elevait coaching session',
      start: {
        dateTime: booking.booking_start_time,
        timeZone: booking.timezone || 'UTC',
      },
      end: {
        dateTime: booking.booking_end_time,
        timeZone: booking.timezone || 'UTC',
      },
      attendees: [
        { email: mentorProfile.email },
        { email: learnerProfile.email },
      ],
      conferenceData: {
        createRequest: {
          requestId: bookingId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    }

    // Call Google Calendar API to create event
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthTokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEventData),
      }
    )

    const calendarEvent = await response.json()

    if (!response.ok) {
      console.error('[Calendar API] Google Calendar API error:', calendarEvent)
      
      // Check if it's an auth error
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Google OAuth token invalid or expired', needsAuth: true },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create calendar event', details: calendarEvent },
        { status: response.status }
      )
    }

    console.log('[Calendar API] Calendar event created:', calendarEvent.id)

    // Extract Google Meet link if available
    const meetLink = calendarEvent.conferenceData?.entryPoints?.find(
      (ep: { entryPointType: string; uri: string }) => ep.entryPointType === 'video'
    )?.uri

    console.log('[Calendar API] Google Meet link:', meetLink)

    // Update booking with calendar event ID and meet link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        google_calendar_event_id: calendarEvent.id,
        google_meet_link: meetLink || null,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('[Calendar API] Failed to update booking with calendar info:', updateError)
      // Don't fail the request, the calendar event was still created
    }

    // Return success with event ID and meet link
    return NextResponse.json({
      eventId: calendarEvent.id,
      meetLink,
      success: true,
    })
  } catch (error) {
    console.error('[Calendar API] Internal server error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
