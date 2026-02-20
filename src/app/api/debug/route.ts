import { NextRequest, NextResponse } from 'next/server'
import { coachApplicationSchema } from '@/lib/validationSchemas'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Debug request body:', body)
    
    try {
      const validatedData = coachApplicationSchema.parse(body)
      return NextResponse.json({ 
        success: true, 
        validatedData,
        message: 'Data is valid' 
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ 
          success: false, 
          errors: error.format(),
          message: 'Validation failed' 
        }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to process request' 
    }, { status: 500 })
  }
}
