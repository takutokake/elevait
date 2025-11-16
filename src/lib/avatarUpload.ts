import { getSupabaseBrowserClient } from './supabaseClient'

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  
  // Create a unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${file.name}`
  const filePath = `${userId}/${fileName}`

  try {
    // Upload the file to the avatars bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`)
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded avatar')
    }

    return urlData.publicUrl
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during avatar upload')
  }
}
