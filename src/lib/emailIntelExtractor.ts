import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export interface EmailIntel {
  stage: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | null
  role: string | null
  company: string | null
  interview_date: string | null
  interview_type: 'phone_screen' | 'technical' | 'hiring_manager' | 'panel' | 'onsite' | 'take_home' | null
  deadline: string | null
  action_items: Array<{ text: string; due: string | null }>
  summary: string | null
  confidence: 'high' | 'medium' | 'low'
}

export function extractBodyText(payload: any): string {
  function decode(data: string): string {
    try {
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    } catch {
      return ''
    }
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  function walk(part: any): { plain: string | null; html: string | null } {
    if (!part) return { plain: null, html: null }

    if (part.mimeType === 'text/plain' && part.body?.data) {
      return { plain: decode(part.body.data), html: null }
    }

    if (part.mimeType === 'text/html' && part.body?.data) {
      return { plain: null, html: decode(part.body.data) }
    }

    if (Array.isArray(part.parts)) {
      let plain: string | null = null
      let html: string | null = null
      for (const child of part.parts) {
        const result = walk(child)
        if (result.plain && !plain) plain = result.plain
        if (result.html && !html) html = result.html
      }
      return { plain, html }
    }

    return { plain: null, html: null }
  }

  const { plain, html } = walk(payload)
  const text = plain || (html ? stripHtml(html) : '')
  return text.slice(0, 1500)
}

export async function extractEmailIntel(params: {
  subject: string
  body: string
  from: string
  receivedDate: string
}): Promise<EmailIntel | null> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return null

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            stage: {
              type: SchemaType.STRING,
              format: 'enum',
              nullable: true,
              enum: ['Applied', 'Interview', 'Offer', 'Rejected'],
              description: 'Application stage. Set Rejected ONLY if explicitly rejected.',
            },
            role: { type: SchemaType.STRING, nullable: true },
            company: { type: SchemaType.STRING, nullable: true },
            interview_date: {
              type: SchemaType.STRING,
              nullable: true,
              description: 'ISO8601 datetime. Only set if a specific day AND time are mentioned.',
            },
            interview_type: {
              type: SchemaType.STRING,
              format: 'enum',
              nullable: true,
              enum: ['phone_screen', 'technical', 'hiring_manager', 'panel', 'onsite', 'take_home'],
            },
            deadline: {
              type: SchemaType.STRING,
              nullable: true,
              description: 'ISO8601 date for application or response deadline.',
            },
            action_items: {
              type: SchemaType.ARRAY,
              description: 'Up to 3 candidate-actionable items.',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  text: { type: SchemaType.STRING },
                  due: { type: SchemaType.STRING, nullable: true },
                },
                required: ['text'],
              },
            },
            summary: {
              type: SchemaType.STRING,
              nullable: true,
              description: 'Max 20-word summary addressed directly to the candidate.',
            },
            confidence: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['high', 'medium', 'low'],
              description: 'Set to low if email is ambiguous, a newsletter, or not clearly about a job application.',
            },
          },
          required: ['confidence', 'action_items'],
        },
      },
    })

    const prompt = `You are an assistant that extracts structured information from job application emails.

Email details:
From: ${params.from}
Date: ${params.receivedDate}
Subject: ${params.subject}
Body (first 1500 chars):
${params.body}

Rules:
- stage: Set to "Rejected" ONLY if the email explicitly rejects the candidate. Set to "Interview" ONLY if the email is personally scheduling/inviting the candidate to an interview, phone screen, or technical assessment for a specific role — NOT for general events, webinars, or networking sessions. Set to "Offer" only if a formal offer is extended. Set to "Applied" if it is an application confirmation. Leave null if unclear.
- interview_date: Only set if a specific day AND time are mentioned for a personal interview. Use ISO8601 format.
- action_items: Only include items the CANDIDATE must act on (e.g. schedule a call, complete an assignment, submit documents). Max 3.
- confidence: Set to "low" if the email is: a company event invitation, career fair, open house, webinar, networking event, newsletter, promotional email, or not clearly about a specific personal job application. Also set to "low" if the email addresses multiple recipients or uses generic language like "check out", "join us", "upcoming events".
- summary: Address the candidate directly. Max 20 words.

Extract the information now.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text) as EmailIntel

    if (!Array.isArray(parsed.action_items)) parsed.action_items = []
    parsed.action_items = parsed.action_items.slice(0, 3)

    return parsed
  } catch {
    return null
  }
}

export function generateRecommendation(
  stage: string | null,
  interview_type: string | null,
  company: string | null,
  interview_date: string | null,
  deadline: string | null,
): string {
  const co = company || 'this company'

  if (stage === 'Offer') {
    if (deadline) {
      return `You have an offer from ${co}! Review every detail carefully and respond before the deadline.`
    }
    return `Congratulations on your offer from ${co}! Compare it to your other opportunities and negotiate if needed.`
  }

  if (stage === 'Rejected') {
    return `Keep going — rejections are part of the process. Note what you'd improve and move to your next target.`
  }

  if (stage === 'Interview' || interview_type) {
    switch (interview_type) {
      case 'phone_screen':
        return `Prep your 60-second "tell me about yourself" and 2–3 thoughtful questions for the recruiter at ${co}.`
      case 'technical':
        return `Practice LeetCode mediums and review system design basics before your technical screen at ${co}.`
      case 'hiring_manager':
        return `Research ${co}'s recent product moves and prepare 3–4 STAR stories aligned to the job description.`
      case 'panel':
        return `For your panel at ${co}, tailor examples to product, engineering, and design perspectives — expect diverse angles.`
      case 'onsite':
        return `For your onsite at ${co}, prepare product cases, metrics frameworks, and cross-functional conflict scenarios.`
      case 'take_home':
        return `Prioritize clarity of thinking over polish on your take-home from ${co} — show your process.`
      default:
        return `Research ${co}'s products and recent news, then prepare concise STAR examples for your upcoming interview.`
    }
  }

  if (stage === 'Applied') {
    return `Your application is in at ${co}. Follow up politely in 5–7 business days if you haven't heard back.`
  }

  return `Stay organized and follow up with ${co} as needed — consistency is key in a job search.`
}
