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
      console.error('[Calendar API] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[Calendar API] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { bookingId } = body

    if (!bookingId || typeof bookingId !== 'string') {
      console.error('[Calendar API] Invalid bookingId:', bookingId)
      return NextResponse.json(
        { error: 'Valid bookingId is required' },
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

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(oauthTokens.expires_at)
    let accessToken = oauthTokens.access_token
    
    if (expiresAt < new Date()) {
      console.log('[Calendar API] Token is expired, attempting refresh')
      
      if (!oauthTokens.refresh_token) {
        console.log('[Calendar API] No refresh token available')
        return NextResponse.json(
          { error: 'Google OAuth token expired and no refresh token available', needsAuth: true },
          { status: 401 }
        )
      }

      // Validate environment variables
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[Calendar API] Missing Google OAuth credentials in environment variables')
        return NextResponse.json(
          { error: 'Server configuration error: Missing OAuth credentials' },
          { status: 500 }
        )
      }

      // Refresh the access token
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: oauthTokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        if (!refreshResponse.ok) {
          let errorData
          try {
            errorData = await refreshResponse.json()
          } catch {
            errorData = { message: refreshResponse.statusText }
          }
          console.error('[Calendar API] Token refresh failed:', {
            status: refreshResponse.status,
            error: errorData
          })
          return NextResponse.json(
            { error: 'Failed to refresh Google OAuth token', needsAuth: true },
            { status: 401 }
          )
        }

        const refreshData = await refreshResponse.json()
        
        if (!refreshData.access_token) {
          console.error('[Calendar API] Token refresh response missing access_token:', refreshData)
          return NextResponse.json(
            { error: 'Invalid token refresh response', needsAuth: true },
            { status: 401 }
          )
        }
        accessToken = refreshData.access_token
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000))

        console.log('[Calendar API] Token refreshed successfully')

        // Update the token in the database
        const { error: updateError } = await supabase
          .from('user_oauth_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', 'google')
        
        if (updateError) {
          console.error('[Calendar API] Failed to update token in database:', updateError)
          // Continue anyway - we have the token in memory
        }

      } catch (refreshError) {
        console.error('[Calendar API] Error refreshing token:', {
          error: refreshError,
          message: refreshError instanceof Error ? refreshError.message : String(refreshError),
          stack: refreshError instanceof Error ? refreshError.stack : undefined
        })
        return NextResponse.json(
          { error: 'Failed to refresh Google OAuth token', needsAuth: true },
          { status: 401 }
        )
      }
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
    let response
    try {
      response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEventData),
        }
      )
    } catch (fetchError) {
      console.error('[Calendar API] Network error calling Google Calendar API:', fetchError)
      return NextResponse.json(
        { error: 'Network error connecting to Google Calendar' },
        { status: 503 }
      )
    }

    let calendarEvent
    try {
      calendarEvent = await response.json()
    } catch (parseError) {
      console.error('[Calendar API] Failed to parse Google Calendar response:', parseError)
      return NextResponse.json(
        { error: 'Invalid response from Google Calendar' },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error('[Calendar API] Google Calendar API error:', {
        status: response.status,
        statusText: response.statusText,
        error: calendarEvent,
        bookingId,
        userId: user.id
      })
      
      // Check if it's an auth error
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Google OAuth token invalid or expired', needsAuth: true },
          { status: 401 }
        )
      }
      
      // Check for permission errors
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Permission denied - missing calendar scopes', needsAuth: true },
          { status: 403 }
        )
      }
      
      // Check for rate limiting
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Google Calendar API rate limit exceeded' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create calendar event', details: calendarEvent?.error?.message || calendarEvent },
        { status: response.status }
      )
    }

    if (!calendarEvent?.id) {
      console.error('[Calendar API] Calendar event created but missing ID:', calendarEvent)
      return NextResponse.json(
        { error: 'Calendar event created but response is invalid' },
        { status: 500 }
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
    console.error('[Calendar API] Internal server error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
