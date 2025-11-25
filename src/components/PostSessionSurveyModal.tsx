'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { Star } from 'lucide-react'

interface PostSessionSurveyModalProps {
  bookingId: string
  onClose: () => void
  onSuccess: () => void
}

export default function PostSessionSurveyModal({
  bookingId,
  onClose,
  onSuccess,
}: PostSessionSurveyModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [attended, setAttended] = useState<boolean | null>(null)
  const [topicsCovered, setTopicsCovered] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    if (attended === null) {
      toast.error('Please confirm if you attended the session')
      return
    }

    if (!topicsCovered.trim()) {
      toast.error('Please describe what topics were covered')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionRating: rating,
          mentorAttended: attended,
          topicsCovered: topicsCovered.trim(),
          additionalNotes: additionalNotes.trim() || null,
        }),
      })

      if (response.ok) {
        toast.success('Survey submitted successfully!')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit survey')
      }
    } catch (error) {
      console.error('Survey submission error:', error)
      toast.error('An error occurred while submitting the survey')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Post-Session Survey</CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Please complete this survey to finalize the session and receive payment.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              How would you rate this session? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Attendance */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Did you attend this session? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={attended === true ? 'default' : 'outline'}
                onClick={() => setAttended(true)}
                className="flex-1"
              >
                Yes, I attended
              </Button>
              <Button
                type="button"
                variant={attended === false ? 'default' : 'outline'}
                onClick={() => setAttended(false)}
                className="flex-1"
              >
                No, I did not attend
              </Button>
            </div>
          </div>

          {/* Topics Covered */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              What topics did you cover? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              placeholder="e.g., Resume review, interview preparation, career planning..."
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Additional notes (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
              placeholder="Any other information you'd like to share..."
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || attended === null || !topicsCovered.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Survey & Complete Session'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            * Required fields. Completing this survey will mark the session as completed and
            process your payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
