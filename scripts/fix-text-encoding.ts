/**
 * Script to fix HTML-encoded text in mentor profiles
 * Fixes aboutMe, shortDescription, and paymentDescription fields
 * Run with: npx tsx scripts/fix-text-encoding.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Make sure .env.local has:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Decode HTML entities - handles multiple levels of encoding
function decodeHtmlEntities(str: string): string {
  if (!str) return str
  
  let decoded = str
  let previousDecoded = ''
  
  // Keep decoding until no more changes occur (handles multiple encoding levels)
  while (decoded !== previousDecoded) {
    previousDecoded = decoded
    
    // Handle common entities
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#47;/g, '/')
      .replace(/&apos;/g, "'")
  }
  
  return decoded
}

async function fixTextEncoding() {
  console.log('🔍 Fetching mentors with text fields...')
  
  // Fetch all mentors
  const { data: mentors, error } = await supabase
    .from('mentors')
    .select('id, about_me, short_description, payment_description')
  
  if (error) {
    console.error('❌ Error fetching mentors:', error)
    return
  }
  
  if (!mentors || mentors.length === 0) {
    console.log('✅ No mentors found')
    return
  }
  
  console.log(`📊 Found ${mentors.length} mentors`)
  
  let fixedCount = 0
  let unchangedCount = 0
  
  for (const mentor of mentors) {
    const updates: any = {}
    let hasChanges = false
    
    // Check and decode about_me
    if (mentor.about_me && mentor.about_me.includes('&')) {
      const decoded = decodeHtmlEntities(mentor.about_me)
      if (decoded !== mentor.about_me) {
        updates.about_me = decoded
        hasChanges = true
      }
    }
    
    // Check and decode short_description
    if (mentor.short_description && mentor.short_description.includes('&')) {
      const decoded = decodeHtmlEntities(mentor.short_description)
      if (decoded !== mentor.short_description) {
        updates.short_description = decoded
        hasChanges = true
      }
    }
    
    // Check and decode payment_description
    if (mentor.payment_description && mentor.payment_description.includes('&')) {
      const decoded = decodeHtmlEntities(mentor.payment_description)
      if (decoded !== mentor.payment_description) {
        updates.payment_description = decoded
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      console.log(`\n🔧 Fixing mentor ${mentor.id}:`)
      
      if (updates.about_me) {
        console.log('   About Me:')
        console.log('     Before:', mentor.about_me.substring(0, 100) + '...')
        console.log('     After:', updates.about_me.substring(0, 100) + '...')
      }
      
      if (updates.short_description) {
        console.log('   Short Description:')
        console.log('     Before:', mentor.short_description)
        console.log('     After:', updates.short_description)
      }
      
      if (updates.payment_description) {
        console.log('   Payment Description:')
        console.log('     Before:', mentor.payment_description)
        console.log('     After:', updates.payment_description)
      }
      
      const { error: updateError } = await supabase
        .from('mentors')
        .update(updates)
        .eq('id', mentor.id)
      
      if (updateError) {
        console.error(`   ❌ Error updating mentor ${mentor.id}:`, updateError)
      } else {
        console.log('   ✅ Updated successfully')
        fixedCount++
      }
    } else {
      unchangedCount++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Fixed: ${fixedCount} mentors`)
  console.log(`⏭️  Unchanged: ${unchangedCount} mentors`)
  console.log('='.repeat(50))
}

// Run the script
fixTextEncoding()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
