'use client'

import React, { useState, useCallback } from 'react'
import { getUserTimezone, getTimezoneFriendlyName, COMMON_TIMEZONES } from '@/lib/dateUtils'

interface TimeSlot {
  day: number
  hour: number
  minute?: number
}

interface WeeklyAvailabilityGridProps {
  initialAvailability?: TimeSlot[]
  onSave?: (availability: TimeSlot[], timezone: string) => Promise<void>
  initialTimezone?: string
}

export function WeeklyAvailabilityGrid({
  initialAvailability = [],
  onSave,
  initialTimezone
}: WeeklyAvailabilityGridProps) {
  const [availability, setAvailability] = useState<TimeSlot[]>(initialAvailability)
  const [timezone, setTimezone] = useState(initialTimezone || getUserTimezone())
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Generate 30-minute slots from 8am to 9pm (8:00, 8:30, 9:00, ... 20:30)
  const timeSlots: { hour: number; minute: number }[] = []
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push({ hour, minute: 0 })
    if (hour < 20) {
      timeSlots.push({ hour, minute: 30 })
    }
  }

  const isSlotSelected = useCallback((day: number, hour: number, minute: number) => {
    return availability.some(s => s.day === day && s.hour === hour && (s.minute || 0) === minute)
  }, [availability])

  const toggleSlot = useCallback((day: number, hour: number, minute: number, forceMode?: 'select' | 'deselect') => {
    setAvailability(prev => {
      const exists = prev.some(s => s.day === day && s.hour === hour && (s.minute || 0) === minute)
      const mode = forceMode || (exists ? 'deselect' : 'select')

      if (mode === 'deselect') {
        return prev.filter(s => !(s.day === day && s.hour === hour && (s.minute || 0) === minute))
      } else {
        if (!exists) {
          return [...prev, { day, hour, minute }]
        }
        return prev
      }
    })
  }, [])

  const handleMouseDown = (day: number, hour: number, minute: number) => {
    const exists = isSlotSelected(day, hour, minute)
    const mode = exists ? 'deselect' : 'select'
    setIsDragging(true)
    setDragMode(mode)
    toggleSlot(day, hour, minute, mode)
  }

  const handleMouseEnter = (day: number, hour: number, minute: number) => {
    if (isDragging) {
      toggleSlot(day, hour, minute, dragMode)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Quick select presets
  const selectWeekdayMornings = () => {
    const slots: TimeSlot[] = []
    for (let day = 1; day <= 5; day++) {
      for (let hour = 9; hour <= 11; hour++) {
        slots.push({ day, hour, minute: 0 })
        slots.push({ day, hour, minute: 30 })
      }
    }
    setAvailability(slots)
  }

  const selectWeekdayAfternoons = () => {
    const slots: TimeSlot[] = []
    for (let day = 1; day <= 5; day++) {
      for (let hour = 13; hour <= 16; hour++) {
        slots.push({ day, hour, minute: 0 })
        slots.push({ day, hour, minute: 30 })
      }
    }
    setAvailability(slots)
  }

  const selectEvenings = () => {
    const slots: TimeSlot[] = []
    for (let day = 1; day <= 5; day++) {
      for (let hour = 18; hour <= 20; hour++) {
        slots.push({ day, hour, minute: 0 })
        if (hour < 20) slots.push({ day, hour, minute: 30 })
      }
    }
    setAvailability(slots)
  }

  const selectWeekends = () => {
    const slots: TimeSlot[] = []
    for (const day of [0, 6]) {
      for (let hour = 10; hour <= 17; hour++) {
        slots.push({ day, hour, minute: 0 })
        slots.push({ day, hour, minute: 30 })
      }
    }
    setAvailability(slots)
  }

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'p' : 'a'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')}${period}`
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(availability, timezone)
    } catch (error) {
      console.error('Failed to save availability:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="space-y-4"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timezone Selector - Top Right */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#333333] dark:text-white">Set Your Weekly Availability</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-medium text-[#333333] dark:text-white transition-colors"
          >
            <span>🌐</span>
            <span>{getTimezoneFriendlyName(timezone)}</span>
            <svg className={`w-4 h-4 transition-transform ${showTimezoneDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTimezoneDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {COMMON_TIMEZONES.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => {
                    setTimezone(tz.value)
                    setShowTimezoneDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    timezone === tz.value ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] font-medium' : 'text-[#333333] dark:text-white'
                  }`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#333333] dark:text-white">Quick Pick:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={selectWeekdayMornings}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-[#333333] dark:text-white transition-colors"
          >
            ☀️ Mornings <span className="text-[10px] text-[#333333]/60 dark:text-[#F5F5F5]/60">(9am-12pm Mon-Fri)</span>
          </button>
          <button
            type="button"
            onClick={selectWeekdayAfternoons}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-[#333333] dark:text-white transition-colors"
          >
            🌤️ Afternoons <span className="text-[10px] text-[#333333]/60 dark:text-[#F5F5F5]/60">(1pm-5pm Mon-Fri)</span>
          </button>
          <button
            type="button"
            onClick={selectEvenings}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-[#333333] dark:text-white transition-colors"
          >
            🌙 Evenings <span className="text-[10px] text-[#333333]/60 dark:text-[#F5F5F5]/60">(6pm-9pm Mon-Fri)</span>
          </button>
          <button
            type="button"
            onClick={selectWeekends}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-[#333333] dark:text-white transition-colors"
          >
            🎉 Weekends <span className="text-[10px] text-[#333333]/60 dark:text-[#F5F5F5]/60">(10am-6pm Sat-Sun)</span>
          </button>
          <button
            type="button"
            onClick={() => setAvailability([])}
            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Compact Calendar Grid */}
      <div
        className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ userSelect: 'none' }}
      >
        <table className="w-full border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-16" />
            {days.map((_, idx) => (
              <col key={idx} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="p-1.5 text-left text-xs font-semibold text-[#333333] dark:text-white border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="p-1.5 text-center text-xs font-semibold text-[#333333] dark:text-white border-b border-gray-200 dark:border-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(({ hour, minute }) => (
              <tr key={`${hour}-${minute}`}>
                <td className="p-1 text-[10px] text-[#333333]/60 dark:text-[#F5F5F5]/60 font-medium border-b border-gray-100 dark:border-gray-700/50 sticky left-0 bg-white dark:bg-gray-800 z-10">
                  {formatTime(hour, minute)}
                </td>
                {days.map((_, dayIndex) => (
                  <td key={dayIndex} className="p-0.5 border-b border-gray-100 dark:border-gray-700/50">
                    <button
                      type="button"
                      onMouseDown={() => handleMouseDown(dayIndex, hour, minute)}
                      onMouseEnter={() => handleMouseEnter(dayIndex, hour, minute)}
                      className={`
                        w-full h-6 rounded transition-all duration-100
                        ${isSlotSelected(dayIndex, hour, minute)
                          ? 'bg-[#0ea5e9] hover:bg-[#0284c7]'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-[#0ea5e9]/30'
                        }
                        ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                      `}
                      onClick={(e) => e.preventDefault()}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with info and save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
          <span>
            <strong className="text-[#0ea5e9]">{availability.length}</strong> slots selected
          </span>
          <span>•</span>
          <span>Click & drag to select</span>
          <span>•</span>
          <span>{timezone}</span>
        </div>
        
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || availability.length === 0}
            className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Availability'}
          </button>
        )}
      </div>
    </div>
  )
}
