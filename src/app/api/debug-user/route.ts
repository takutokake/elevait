import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabaseServer'

export async function GET() {
  const { user } = await getSessionUser()
  
  return NextResponse.json({ user })
}
