import { Resend } from 'resend';

// Initialize Resend with API key (gracefully handle missing key)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface BookingEmailData {
  studentName: string;
  studentEmail: string;
  coachName: string;
  coachEmail: string;
  bookingDate: string;
  bookingTime: string;
  duration: string;
  sessionNotes?: string;
}

interface CancellationEmailData {
  studentName: string;
  studentEmail: string;
  coachName: string;
  coachEmail: string;
  bookingDate: string;
  bookingTime: string;
  cancellationReason: string;
  cancelledBy: 'coach' | 'student';
}

/**
 * Send email notification when a student books a lesson
 * Sends to: student, coach, and tryelevait@gmail.com
 */
export async function sendBookingRequestEmails(data: BookingEmailData) {
  // Skip if Resend is not configured
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email notifications')
    return []
  }

  const { studentName, studentEmail, coachName, coachEmail, bookingDate, bookingTime, duration, sessionNotes } = data;

  // Validate required email addresses
  if (!studentEmail) {
    console.error('Student email is missing - cannot send booking emails')
    return []
  }
  if (!coachEmail) {
    console.error('Coach email is missing - cannot send coach notification')
  }

  // Email to Student
  const studentEmail_promise = resend.emails.send({
    from: 'Elevait <bookings@elevait.space>',
    to: studentEmail,
    subject: 'Booking Request Submitted - Awaiting Coach Approval',
    replyTo: 'tryelevait@gmail.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #0ea5e9; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Request Submitted!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${studentName}</strong>,</p>
              <p>Your booking request has been submitted and is awaiting approval from your coach.</p>
              
              <div class="info-box">
                <h3>📅 Session Details</h3>
                <div class="info-row"><span class="label">Coach:</span> ${coachName}</div>
                <div class="info-row"><span class="label">Date:</span> ${bookingDate}</div>
                <div class="info-row"><span class="label">Time:</span> ${bookingTime}</div>
                <div class="info-row"><span class="label">Duration:</span> ${duration}</div>
                ${sessionNotes ? `<div class="info-row"><span class="label">Notes:</span> ${sessionNotes}</div>` : ''}
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your coach will review your booking request</li>
                <li>You'll receive a google calendar once booking is verified with meeting details</li>
              </ul>

              <p style="text-align: center;">
                <a href="https://elevait.space/student/sessions" class="button">View My Sessions</a>
              </p>

              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:tryelevait@gmail.com">tryelevait@gmail.com</a></p>
                <p>© ${new Date().getFullYear()} Elevait. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  });

  // Email to Coach (only create promise if email exists)
  let coachEmail_promise = null;
  if (coachEmail) {
    coachEmail_promise = resend.emails.send({
      from: 'Elevait <bookings@elevait.space>',
      to: coachEmail,
      subject: 'New Booking Request - Action Required',
      replyTo: 'tryelevait@gmail.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #8b5cf6; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button-secondary { background: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Booking Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${coachName}</strong>,</p>
              <p>You have a new booking request from a student!</p>
              
              <div class="info-box">
                <h3>📅 Session Details</h3>
                <div class="info-row"><span class="label">Student:</span> ${studentName}</div>
                <div class="info-row"><span class="label">Email:</span> ${studentEmail}</div>
                <div class="info-row"><span class="label">Date:</span> ${bookingDate}</div>
                <div class="info-row"><span class="label">Time:</span> ${bookingTime}</div>
                <div class="info-row"><span class="label">Duration:</span> ${duration}</div>
                ${sessionNotes ? `<div class="info-row"><span class="label">Session Notes:</span> ${sessionNotes}</div>` : ''}
              </div>

              <div class="alert">
                <strong>⏰ Action Required:</strong> Please review and respond to this booking request as soon as possible.
              </div>

              <p style="text-align: center;">
                <a href="https://elevait.space/mentor/sessions" class="button">Approve Booking</a>
                <a href="https://elevait.space/mentor/sessions" class="button button-secondary">View Details</a>
              </p>

              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:tryelevait@gmail.com">tryelevait@gmail.com</a></p>
                <p>© ${new Date().getFullYear()} Elevait. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    });
  }

  // Wait for all emails to send (only include coach email if address exists)
  const emailPromises = [studentEmail_promise];
  const recipients = ['student'];
  
  if (coachEmail && coachEmail_promise) {
    emailPromises.push(coachEmail_promise);
    recipients.push('coach');
  }
  
  const results = await Promise.allSettled(emailPromises);
  
  // Log any errors but don't fail the booking
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Failed to send booking email to ${recipients[index]}:`, result.reason);
    } else {
      console.log(`✅ Booking email sent to ${recipients[index]}:`, result.value);
    }
  });

  console.log(`📧 Total emails sent: ${results.filter(r => r.status === 'fulfilled').length}/${results.length}`);
  
  return results;
}

/**
 * Send email notification when a coach cancels a session
 * Sends to: student, coach, and tryelevait@gmail.com
 */
export async function sendCancellationEmails(data: CancellationEmailData) {
  // Skip if Resend is not configured
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email notifications')
    return []
  }

  const { studentName, studentEmail, coachName, coachEmail, bookingDate, bookingTime, cancellationReason, cancelledBy } = data;

  // Validate required email addresses
  if (!studentEmail) {
    console.error('Student email is missing - cannot send cancellation emails')
    return []
  }
  if (!coachEmail) {
    console.error('Coach email is missing - cannot send coach cancellation notification')
  }

  // Email to Student
  const studentEmail_promise = resend.emails.send({
    from: 'Elevait <bookings@elevait.space>',
    to: studentEmail,
    subject: 'Session Cancelled - Important Update',
    replyTo: 'tryelevait@gmail.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #ef4444; }
            .reason-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Session Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${studentName}</strong>,</p>
              <p>We're sorry to inform you that your session has been cancelled by ${cancelledBy === 'coach' ? 'your coach' : 'you'}.</p>
              
              <div class="info-box">
                <h3>📅 Cancelled Session Details</h3>
                <div class="info-row"><span class="label">Coach:</span> ${coachName}</div>
                <div class="info-row"><span class="label">Date:</span> ${bookingDate}</div>
                <div class="info-row"><span class="label">Time:</span> ${bookingTime}</div>
              </div>

              <div class="reason-box">
                <strong>Cancellation Reason:</strong><br/>
                ${cancellationReason}
              </div>

              <p><strong>What's next?</strong></p>
              <ul>
                <li>You can book another session with ${coachName} or explore other coaches</li>
                <li>If you have any questions, please reach out to support</li>
                <li>Check your account for any refund processing (if applicable)</li>
              </ul>

              <p style="text-align: center;">
                <a href="https://elevait.space/coaches" class="button">Find Another Coach</a>
              </p>

              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:tryelevait@gmail.com">tryelevait@gmail.com</a></p>
                <p>© ${new Date().getFullYear()} Elevait. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  });

  // Email to Coach (only create promise if email exists)
  let coachEmail_promise = null;
  if (coachEmail) {
    coachEmail_promise = resend.emails.send({
      from: 'Elevait <bookings@elevait.space>',
      to: coachEmail,
      subject: 'Session Cancellation Confirmation',
      replyTo: 'tryelevait@gmail.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Cancellation Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${coachName}</strong>,</p>
              <p>This confirms that the session has been cancelled. The student has been notified.</p>
              
              <div class="info-box">
                <h3>📅 Cancelled Session</h3>
                <div class="info-row"><span class="label">Student:</span> ${studentName}</div>
                <div class="info-row"><span class="label">Date:</span> ${bookingDate}</div>
                <div class="info-row"><span class="label">Time:</span> ${bookingTime}</div>
                <div class="info-row"><span class="label">Reason:</span> ${cancellationReason}</div>
              </div>

              <p>The time slot is now available for other bookings.</p>

              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:tryelevait@gmail.com">tryelevait@gmail.com</a></p>
                <p>© ${new Date().getFullYear()} Elevait. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    });
  }

  // Wait for all emails to send (only include coach email if address exists)
  const emailPromises = [studentEmail_promise];
  const recipients = ['student'];
  
  if (coachEmail && coachEmail_promise) {
    emailPromises.push(coachEmail_promise);
    recipients.push('coach');
  }
  
  const results = await Promise.allSettled(emailPromises);
  
  // Log any errors but don't fail the cancellation
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Failed to send cancellation email to ${recipients[index]}:`, result.reason);
    } else {
      console.log(`✅ Cancellation email sent to ${recipients[index]}:`, result.value);
    }
  });

  console.log(`📧 Total cancellation emails sent: ${results.filter(r => r.status === 'fulfilled').length}/${results.length}`);
  
  return results;
}

/**
 * Send Slack notification when a new booking is created
 * Sends to: Slack channel via webhook
 */
export async function sendSlackBookingNotification(data: BookingEmailData) {
  console.log('🔔 [Slack] sendSlackBookingNotification called with data:', data)
  const webhookUrl = process.env.SLACK_WEBHOOK
  console.log('🔔 [Slack] Webhook URL exists:', !!webhookUrl)
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK not configured - skipping Slack notification')
    return null
  }

  const { studentName, studentEmail, coachName, coachEmail, bookingDate, bookingTime, duration, sessionNotes } = data
  console.log('🔔 [Slack] Preparing message for:', { studentName, coachName, bookingDate, bookingTime })

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎯 New Booking Alert!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Student:*\n${studentName}\n${studentEmail}`
          },
          {
            type: "mrkdwn",
            text: `*Coach:*\n${coachName}\n${coachEmail}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Date:*\n${bookingDate}`
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${bookingTime}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Duration:* ${duration}${sessionNotes ? `\n*Notes:* ${sessionNotes}` : ''}`
        }
      },
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "📅 Booking created via Elevait"
          }
        ]
      }
    ]
  }

  try {
    console.log('🔔 [Slack] Sending POST request to webhook...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    console.log('🔔 [Slack] Response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('🔔 [Slack] Error response:', errorText)
      throw new Error(`Slack API error: ${response.status} - ${errorText}`)
    }

    console.log('✅ Slack booking notification sent successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to send Slack booking notification:', error)
    return null
  }
}

/**
 * Send admin notification email when a new booking is created
 * Sends to: tryelevait@gmail.com
 */
export async function sendAdminBookingNotification(data: BookingEmailData) {
  // Skip if Resend is not configured
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping admin notification')
    return null
  }

  const { studentName, studentEmail, coachName, coachEmail, bookingDate, bookingTime, duration, sessionNotes } = data;

  try {
    const result = await resend.emails.send({
      from: 'Elevait <bookings@elevait.space>',
      to: 'tryelevait@gmail.com',
      subject: `🎯 New Booking: ${studentName} → ${coachName}`,
      replyTo: studentEmail,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
              .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
              .info-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #f97316; display: inline-block; width: 120px; }
              .value { color: #333; }
              .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 New Booking Alert!</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">A student just booked a session</p>
              </div>
              <div class="content">
                <div class="highlight">
                  <strong>📊 Quick Summary:</strong><br/>
                  <strong>${studentName}</strong> booked a session with <strong>${coachName}</strong> on <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong>
                </div>
                
                <div class="info-box">
                  <h3 style="margin-top: 0; color: #f97316;">👤 Student Details</h3>
                  <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">${studentName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value"><a href="mailto:${studentEmail}">${studentEmail}</a></span>
                  </div>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #8b5cf6;">🎓 Coach Details</h3>
                  <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">${coachName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value"><a href="mailto:${coachEmail}">${coachEmail}</a></span>
                  </div>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #0ea5e9;">📅 Session Details</h3>
                  <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">${bookingDate}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Time:</span>
                    <span class="value">${bookingTime}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Duration:</span>
                    <span class="value">${duration}</span>
                  </div>
                  ${sessionNotes ? `
                  <div class="info-row">
                    <span class="label">Notes:</span>
                    <span class="value">${sessionNotes}</span>
                  </div>
                  ` : ''}
                </div>

                <div class="footer">
                  <p style="margin: 5px 0;">🔔 This is an automated notification from Elevait</p>
                  <p style="margin: 5px 0;">© ${new Date().getFullYear()} Elevait. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    console.log('✅ Admin booking notification sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send admin booking notification:', error);
    return null;
  }
}

/**
 * Send Slack notification when a new coach application is submitted
 */
export async function sendSlackCoachApplicationNotification(data: {
  applicantName: string
  applicantEmail: string
  currentTitle: string
  currentCompany: string
  yearsExperience: number
  focusAreas: string[]
  linkedinUrl: string
  alumniSchool?: string
  pricingModel: string
  applicationId?: string // Add applicationId parameter
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK

  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK not configured - skipping Slack notification')
    return null
  }

  const {
    applicantName,
    applicantEmail,
    currentTitle,
    currentCompany,
    yearsExperience,
    focusAreas,
    linkedinUrl,
    alumniSchool,
    pricingModel,
  } = data

  // Include application ID if provided
  const applicationId = data.applicationId || 'unknown'

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📋 New Coach Application!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Applicant:*\n${applicantName}\n${applicantEmail}`
          },
          {
            type: "mrkdwn",
            text: `*Current Role:*\n${currentTitle} at ${currentCompany}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Experience:*\n${yearsExperience} year${yearsExperience !== 1 ? 's' : ''}`
          },
          {
            type: "mrkdwn",
            text: `*Pricing Model:*\n${pricingModel}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Focus Areas:*\n${focusAreas.length > 0 ? focusAreas.join(', ') : 'None specified'}${alumniSchool ? `\n*Alumni:* ${alumniSchool}` : ''}${linkedinUrl ? `\n*LinkedIn:* <${linkedinUrl}|View Profile>` : ''}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Application ID:* ${applicationId}\n👉 *React with :white_check_mark: to approve this application*`
        }
      },
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "📋 Coach application submitted via Elevait — approve with emoji reaction or review in admin dashboard"
          }
        ]
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }

    console.log('✅ Slack coach application notification sent')
    return true
  } catch (error) {
    console.error('❌ Failed to send Slack coach application notification:', error)
    return null
  }
}
