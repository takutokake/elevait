'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { toast } from 'react-toastify'

interface BookmarkButtonProps {
  mentorId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'card' | 'profile'
}

export default function BookmarkButton({ mentorId, size = 'md', variant = 'card' }: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthAndSavedStatus()
  }, [mentorId])

  const checkAuthAndSavedStatus = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)

      // Check if mentor is saved
      const response = await fetch('/api/students/saved-mentors')
      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.savedMentors?.includes(mentorId) || false)
      }
    } catch (error) {
      console.error('Error checking saved status:', error)
    }
  }

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.info('Please log in to save mentors')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/students/saved-mentors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId,
          action: isSaved ? 'unsave' : 'save'
        })
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'Mentor removed from saved' : 'Mentor saved!')
      } else {
        toast.error('Failed to save mentor')
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`${sizeClasses[size]} rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={isSaved ? 'Remove from saved' : 'Save mentor'}
      >
        <Bookmark
          size={iconSizes[size]}
          className={`transition-colors ${
            isSaved 
              ? 'fill-[#0ea5e9] text-[#0ea5e9]' 
              : 'text-gray-400 group-hover:text-[#0ea5e9]'
          }`}
        />
      </button>
    )
  }

  // Profile variant
  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
        isSaved
          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] hover:bg-[#0ea5e9]/90'
          : 'bg-white dark:bg-gray-800 text-[#333333] dark:text-white border-gray-300 dark:border-gray-700 hover:border-[#0ea5e9]'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Bookmark
        size={20}
        className={isSaved ? 'fill-white' : ''}
      />
      <span className="font-medium">
        {isSaved ? 'Saved' : 'Save Mentor'}
      </span>
    </button>
  )
}
