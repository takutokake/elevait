'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, SlotInfo, Event as BigCalendarEvent, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-toastify'
import { getUserTimezone, roundToNearest30Minutes } from '@/lib/dateUtils'

const localizer = momentLocalizer(moment)

interface AvailabilitySlot {
  id: string
  start_time: string
  end_time: string
  status: 'open' | 'booked' | 'blocked' | 'partially_booked' | 'fully_booked'
  timezone: string
}

interface CalendarEvent extends BigCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    status: 'open' | 'booked' | 'blocked' | 'partially_booked' | 'fully_booked'
    slotId: string
  }
}

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[]
  onCreateSlot: (start: Date, end: Date) => Promise<void>
  onDeleteSlot: (slotId: string) => Promise<void>
  onUpdateSlot?: (slotId: string, start: Date, end: Date) => Promise<void>
  isLoading?: boolean
}

export default function AvailabilityCalendar({
  slots,
  onCreateSlot,
  onDeleteSlot,
  onUpdateSlot,
  isLoading = false,
}: AvailabilityCalendarProps) {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)

  // Convert slots to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return slots.map((slot) => ({
      id: slot.id,
      title: slot.status === 'booked' ? 'Booked' : 'Available',
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        status: slot.status,
        slotId: slot.id,
      },
    }))
  }, [slots])

  // Handle slot selection (drag to create)
  const handleSelectSlot = useCallback(
    async (slotInfo: SlotInfo) => {
      const start = roundToNearest30Minutes(slotInfo.start as Date)
      const end = roundToNearest30Minutes(slotInfo.end as Date)

      // Validate minimum 30-minute slot
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
      if (durationMinutes < 30) {
        toast.error('Minimum slot duration is 30 minutes')
        return
      }

      // Validate not in the past
      if (start < new Date()) {
        toast.error('Cannot create slots in the past')
        return
      }

      try {
        await onCreateSlot(start, end)
        toast.success('Availability slot created')
      } catch (error: any) {
        toast.error(error.message || 'Failed to create slot')
      }
    },
    [onCreateSlot]
  )

  // Handle event selection (click on existing slot)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedSlot(event)
  }, [])

  // Note: Event resize and drag-drop require react-big-calendar DnD addon
  // Commenting out for now - can be re-enabled if addon is installed
  
  // const handleEventResize = useCallback(
  //   async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
  //     if (event.resource.status === 'booked') {
  //       toast.error('Cannot resize booked slots')
  //       return
  //     }
  //     const roundedStart = roundToNearest30Minutes(start)
  //     const roundedEnd = roundToNearest30Minutes(end)
  //     const durationMinutes = (roundedEnd.getTime() - roundedStart.getTime()) / (1000 * 60)
  //     if (durationMinutes < 30) {
  //       toast.error('Minimum slot duration is 30 minutes')
  //       return
  //     }
  //     if (onUpdateSlot) {
  //       try {
  //         await onUpdateSlot(event.resource.slotId, roundedStart, roundedEnd)
  //         toast.success('Slot updated')
  //       } catch (error: any) {
  //         toast.error(error.message || 'Failed to update slot')
  //       }
  //     }
  //   },
  //   [onUpdateSlot]
  // )

  // const handleEventDrop = useCallback(
  //   async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
  //     if (event.resource.status === 'booked') {
  //       toast.error('Cannot move booked slots')
  //       return
  //     }
  //     const roundedStart = roundToNearest30Minutes(start)
  //     const roundedEnd = roundToNearest30Minutes(end)
  //     if (onUpdateSlot) {
  //       try {
  //         await onUpdateSlot(event.resource.slotId, roundedStart, roundedEnd)
  //         toast.success('Slot moved')
  //       } catch (error: any) {
  //         toast.error(error.message || 'Failed to move slot')
  //       }
  //     }
  //   },
  //   [onUpdateSlot]
  // )

  // Handle delete slot
  const handleDeleteSlot = useCallback(async () => {
    if (!selectedSlot) return

    if (selectedSlot.resource.status === 'booked') {
      toast.error('Cannot delete booked slots')
      return
    }

    try {
      await onDeleteSlot(selectedSlot.resource.slotId)
      toast.success('Slot deleted')
      setSelectedSlot(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete slot')
    }
  }, [selectedSlot, onDeleteSlot])

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#10b981' // green for available
    let borderColor = '#059669'
    let title = 'Available'

    if (event.resource.status === 'partially_booked') {
      backgroundColor = '#f97316' // orange for partially booked
      borderColor = '#ea580c'
      title = 'Partially Booked'
    } else if (event.resource.status === 'fully_booked' || event.resource.status === 'booked') {
      backgroundColor = '#ef4444' // red for fully booked
      borderColor = '#dc2626'
      title = 'Fully Booked'
    } else if (event.resource.status === 'blocked') {
      backgroundColor = '#6b7280' // gray for blocked
      borderColor = '#4b5563'
      title = 'Blocked'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        display: 'block',
      },
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Availability Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Available
              </Badge>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                Booked
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Click and drag to create availability slots. Slots are in 30-minute increments.
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              step={30}
              timeslots={1}
              defaultView="week"
              views={['month', 'week', 'day']}
              min={new Date(2024, 0, 1, 6, 0, 0)} // 6 AM
              max={new Date(2024, 0, 1, 22, 0, 0)} // 10 PM
              formats={{
                timeGutterFormat: 'h:mm A',
                eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                  `${localizer?.format(start, 'h:mm A', culture)} - ${localizer?.format(end, 'h:mm A', culture)}`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Slot Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
              <Badge
                className={
                  selectedSlot.resource.status === 'booked'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }
              >
                {selectedSlot.resource.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {moment(selectedSlot.start).format('MMMM D, YYYY')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {moment(selectedSlot.start).format('h:mm A')} -{' '}
                {moment(selectedSlot.end).format('h:mm A')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60))}{' '}
                minutes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSlot(null)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedSlot.resource.status !== 'booked' && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSlot}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Delete Slot
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
