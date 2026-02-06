/**
 * Script to fix HTML-encoded specializations in the database
 * Run with: npx tsx scripts/fix-specializations.ts
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
      .replace(/&#x2F;/g, '/')
      .replace(/&#47;/g, '/')
      .replace(/&apos;/g, "'")
  }
  
  return decoded
}

async function fixSpecializations() {
  console.log('🔍 Fetching mentors with specializations...')
  
  // Fetch all mentors with specializations
  const { data: mentors, error } = await supabase
    .from('mentors')
    .select('id, specializations')
    .not('specializations', 'is', null)
  
  if (error) {
    console.error('❌ Error fetching mentors:', error)
    return
  }
  
  if (!mentors || mentors.length === 0) {
    console.log('✅ No mentors found with specializations')
    return
  }
  
  console.log(`📊 Found ${mentors.length} mentors with specializations`)
  
  let fixedCount = 0
  let unchangedCount = 0
  
  for (const mentor of mentors) {
    const originalSpecs = mentor.specializations as string[]
    const decodedSpecs = originalSpecs.map(spec => decodeHtmlEntities(spec))
    
    // Remove duplicates (case-insensitive)
    const uniqueSpecs = Array.from(new Set(decodedSpecs.map(s => s.toLowerCase())))
      .map(lower => decodedSpecs.find(s => s.toLowerCase() === lower)!)
    
    // Check if any changes were made (decoding or deduplication)
    const hasChanges = originalSpecs.length !== uniqueSpecs.length || 
                       originalSpecs.some((spec, i) => spec !== uniqueSpecs[i])
    
    if (hasChanges) {
      console.log(`\n🔧 Fixing mentor ${mentor.id}:`)
      console.log('   Before:', originalSpecs)
      console.log('   After:', uniqueSpecs)
      
      const { error: updateError } = await supabase
        .from('mentors')
        .update({ specializations: uniqueSpecs })
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
fixSpecializations()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
