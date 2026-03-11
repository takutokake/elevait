import { SupabaseClient } from '@supabase/supabase-js'

interface CalendarEventData {
  bookingId: string
  mentorEmail: string
  mentorName: string
  learnerEmail: string
  learnerName: string
  startTime: string
  endTime: string
  timezone: string
  sessionNotes?: string
}

interface CalendarEventResult {
  success: boolean
  eventId?: string
  meetLink?: string
  error?: string
  needsAuth?: boolean
}

/**
 * Create a Google Calendar event with Google Meet for a booking
 * This function handles token refresh automatically
 */
export async function createCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  eventData: CalendarEventData
): Promise<CalendarEventResult> {
  try {
    // Validate input data
    if (!userId || !eventData.bookingId) {
      console.error('[Calendar Service] Missing required parameters:', { userId, bookingId: eventData.bookingId })
      return {
        success: false,
        error: 'Missing required parameters',
      }
    }

    if (!eventData.mentorEmail || !eventData.learnerEmail) {
      console.error('[Calendar Service] Missing email addresses:', { 
        mentorEmail: eventData.mentorEmail, 
        learnerEmail: eventData.learnerEmail 
      })
      return {
        success: false,
        error: 'Missing attendee email addresses',
      }
    }

    console.log('[Calendar Service] Creating calendar event for booking:', eventData.bookingId)

    // Check if user has Google OAuth token with calendar scopes
    const { data: oauthTokens, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, refresh_token, provider_scopes, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !oauthTokens?.access_token) {
      console.log('[Calendar Service] No OAuth token found for user:', {
        userId,
        tokenError: tokenError?.message,
        hasTokens: !!oauthTokens
      })
      return {
        success: false,
        error: 'Google OAuth token not found',
        needsAuth: true,
      }
    }

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(oauthTokens.expires_at)
    let accessToken = oauthTokens.access_token

    if (expiresAt < new Date()) {
      console.log('[Calendar Service] Token is expired, attempting refresh')

      if (!oauthTokens.refresh_token) {
        console.log('[Calendar Service] No refresh token available')
        return {
          success: false,
          error: 'Google OAuth token expired and no refresh token available',
          needsAuth: true,
        }
      }

      // Validate environment variables
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[Calendar Service] Missing Google OAuth credentials in environment variables')
        return {
          success: false,
          error: 'Server configuration error: Missing OAuth credentials',
        }
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
          console.error('[Calendar Service] Token refresh failed:', {
            status: refreshResponse.status,
            error: errorData
          })
          return {
            success: false,
            error: 'Failed to refresh Google OAuth token',
            needsAuth: true,
          }
        }

        const refreshData = await refreshResponse.json()
        
        if (!refreshData.access_token) {
          console.error('[Calendar Service] Token refresh response missing access_token:', refreshData)
          return {
            success: false,
            error: 'Invalid token refresh response',
            needsAuth: true,
          }
        }
        accessToken = refreshData.access_token
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000))

        console.log('[Calendar Service] Token refreshed successfully')

        // Update the token in the database
        const { error: updateError } = await supabase
          .from('user_oauth_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('provider', 'google')
        
        if (updateError) {
          console.error('[Calendar Service] Failed to update token in database:', updateError)
          // Continue anyway - we have the token in memory
        }
      } catch (refreshError) {
        console.error('[Calendar Service] Error refreshing token:', {
          error: refreshError,
          message: refreshError instanceof Error ? refreshError.message : String(refreshError),
          stack: refreshError instanceof Error ? refreshError.stack : undefined
        })
        return {
          success: false,
          error: 'Failed to refresh Google OAuth token',
          needsAuth: true,
        }
      }
    }

    console.log('[Calendar Service] Creating Google Calendar event')

    // Create Google Calendar event
    const calendarEventData = {
      summary: `Elevait Session: ${eventData.mentorName} & ${eventData.learnerName}`,
      description: eventData.sessionNotes || 'Elevait coaching session',
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timezone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timezone || 'UTC',
      },
      attendees: [
        { email: eventData.mentorEmail },
        { email: eventData.learnerEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: eventData.bookingId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
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
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEventData),
        }
      )
    } catch (fetchError) {
      console.error('[Calendar Service] Network error calling Google Calendar API:', fetchError)
      return {
        success: false,
        error: 'Network error connecting to Google Calendar',
      }
    }

    let calendarEvent
    try {
      calendarEvent = await response.json()
    } catch (parseError) {
      console.error('[Calendar Service] Failed to parse Google Calendar response:', parseError)
      return {
        success: false,
        error: 'Invalid response from Google Calendar',
      }
    }

    if (!response.ok) {
      console.error('[Calendar Service] Google Calendar API error:', {
        status: response.status,
        statusText: response.statusText,
        error: calendarEvent,
        eventData: {
          summary: calendarEventData.summary,
          startTime: calendarEventData.start.dateTime,
          endTime: calendarEventData.end.dateTime,
          attendees: calendarEventData.attendees.map(a => a.email),
        }
      })

      // Check if it's an auth error
      if (response.status === 401) {
        console.error('[Calendar Service] Authentication failed - token may be invalid or missing scopes')
        return {
          success: false,
          error: 'Google OAuth token invalid or expired',
          needsAuth: true,
        }
      }

      if (response.status === 403) {
        console.error('[Calendar Service] Permission denied - user may not have calendar access')
        return {
          success: false,
          error: 'Permission denied to access Google Calendar',
          needsAuth: true,
        }
      }

      if (response.status === 429) {
        console.error('[Calendar Service] Rate limit exceeded')
        return {
          success: false,
          error: 'Google Calendar API rate limit exceeded',
        }
      }

      return {
        success: false,
        error: `Failed to create calendar event: ${response.status} ${response.statusText}`,
      }
    }

    if (!calendarEvent?.id) {
      console.error('[Calendar Service] Calendar event created but missing ID:', calendarEvent)
      return {
        success: false,
        error: 'Calendar event created but response is invalid',
      }
    }

    console.log('[Calendar Service] Calendar event created:', calendarEvent.id)

    // Extract Google Meet link if available
    const meetLink = calendarEvent.conferenceData?.entryPoints?.find(
      (ep: { entryPointType: string; uri: string }) => ep.entryPointType === 'video'
    )?.uri

    console.log('[Calendar Service] Google Meet link:', meetLink)

    // Update booking with calendar event ID and meet link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        google_calendar_event_id: calendarEvent.id,
        google_meet_link: meetLink || null,
      })
      .eq('id', eventData.bookingId)

    if (updateError) {
      console.error('[Calendar Service] Failed to update booking with calendar info:', updateError)
      // Don't fail the request, the calendar event was still created
    }

    return {
      success: true,
      eventId: calendarEvent.id,
      meetLink,
    }
  } catch (error) {
    console.error('[Calendar Service] Internal error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bookingId: eventData?.bookingId
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
