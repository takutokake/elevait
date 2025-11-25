import { format, parseISO, addMinutes, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert UTC date to user's timezone
 */
export function toUserTimezone(utcDate: Date | string, timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, tz);
}

/**
 * Convert user's timezone date to UTC
 */
export function toUTC(localDate: Date, timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  return fromZonedTime(localDate, tz);
}

/**
 * Format date in user's timezone
 */
export function formatInUserTimezone(
  date: Date | string,
  formatStr: string,
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, tz, formatStr);
}

/**
 * Round time to nearest 30-minute interval
 */
export function roundToNearest30Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 30) * 30;
  const result = new Date(date);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

/**
 * Generate 30-minute time slots between start and end times
 */
export function generate30MinuteSlots(startTime: Date, endTime: Date): Date[] {
  const slots: Date[] = [];
  let current = new Date(startTime);
  
  while (current < endTime) {
    slots.push(new Date(current));
    current = addMinutes(current, 30);
  }
  
  return slots;
}

/**
 * Generate time slots for a given date range
 */
export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 30
): Date[] {
  const slots: Date[] = []
  let current = new Date(startDate)

  while (current < endDate) {
    slots.push(new Date(current))
    current = addMinutes(current, intervalMinutes)
  }

  return slots
}

/**
 * Check if a time is aligned to 30-minute intervals
 */
export function isAlignedTo30Minutes(date: Date): boolean {
  return date.getMinutes() % 30 === 0 && date.getSeconds() === 0;
}

/**
 * Compute 30-minute sub-slots from a continuous availability range
 * Returns array of { start, end, isAvailable } objects
 */
export interface SubSlot {
  start: Date
  end: Date
  isAvailable: boolean
}

export function computeSubSlots(
  availabilityStart: Date,
  availabilityEnd: Date,
  bookedRanges: Array<{ start: Date; end: Date }> = []
): SubSlot[] {
  const subSlots: SubSlot[] = []
  let current = new Date(availabilityStart)
  const end = new Date(availabilityEnd)

  while (current < end) {
    const slotEnd = addMinutes(current, 30)
    
    // Check if this sub-slot overlaps with any booked range
    const isBooked = bookedRanges.some(booked => {
      return (
        (current >= booked.start && current < booked.end) ||
        (slotEnd > booked.start && slotEnd <= booked.end) ||
        (current <= booked.start && slotEnd >= booked.end)
      )
    })

    subSlots.push({
      start: new Date(current),
      end: new Date(slotEnd),
      isAvailable: !isBooked
    })

    current = slotEnd
  }

  return subSlots
}

/**
 * Check if a booking range is valid (minimum 60 minutes, 30-minute aligned)
 */
export function validateBookingRange(
  start: Date,
  end: Date
): { valid: boolean; error?: string } {
  // Check 30-minute alignment
  if (!isAlignedTo30Minutes(start) || !isAlignedTo30Minutes(end)) {
    return { valid: false, error: 'Times must be aligned to 30-minute intervals (:00 or :30)' }
  }

  // Check minimum duration
  const durationMinutes = getDurationInMinutes(start, end)
  if (durationMinutes < 60) {
    return { valid: false, error: 'Minimum booking duration is 60 minutes' }
  }

  // Check duration is multiple of 30
  if (durationMinutes % 30 !== 0) {
    return { valid: false, error: 'Booking duration must be a multiple of 30 minutes' }
  }

  return { valid: true }
}

/**
 * Check if a booking range fits within an availability range
 */
export function isWithinRange(
  bookingStart: Date,
  bookingEnd: Date,
  availabilityStart: Date,
  availabilityEnd: Date
): boolean {
  return bookingStart >= availabilityStart && bookingEnd <= availabilityEnd
}

/**
 * Get contiguous available sub-slots for booking
 * Returns groups of contiguous available slots
 */
export function getContiguousSlots(subSlots: SubSlot[]): SubSlot[][] {
  const groups: SubSlot[][] = []
  let currentGroup: SubSlot[] = []

  for (const slot of subSlots) {
    if (slot.isAvailable) {
      currentGroup.push(slot)
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
        currentGroup = []
      }
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

/**
 * Check if selected slots are contiguous
 */
export function areSlotsContiguous(slots: SubSlot[]): boolean {
  if (slots.length <= 1) return true

  for (let i = 1; i < slots.length; i++) {
    if (slots[i].start.getTime() !== slots[i - 1].end.getTime()) {
      return false
    }
  }

  return true
}

/**
 * Calculate duration in minutes between two dates
 */
export function getDurationInMinutes(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * Validate booking duration (minimum 60 minutes)
 */
export function isValidBookingDuration(start: Date | string, end: Date | string): boolean {
  const duration = getDurationInMinutes(start, end);
  return duration >= 60;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Format time range for display
 */
export function formatTimeRange(
  start: Date | string,
  end: Date | string,
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const startFormatted = formatInTimeZone(startDate, tz, 'h:mm a');
  const endFormatted = formatInTimeZone(endDate, tz, 'h:mm a');
  
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date | string, timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, tz, 'EEE, MMM d, yyyy');
}

/**
 * Get date range for calendar view (start and end of day in UTC)
 */
export function getDateRangeUTC(date: Date, timezone?: string): { start: Date; end: Date } {
  const tz = timezone || getUserTimezone();
  const localStart = startOfDay(date);
  const localEnd = endOfDay(date);
  
  return {
    start: fromZonedTime(localStart, tz),
    end: fromZonedTime(localEnd, tz),
  };
}

/**
 * Convert datetime-local input value to UTC
 */
export function datetimeLocalToUTC(datetimeLocal: string, timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  // datetime-local format: "2024-01-15T14:30"
  const localDate = new Date(datetimeLocal);
  return fromZonedTime(localDate, tz);
}

/**
 * Convert UTC date to datetime-local input value
 */
export function utcToDatetimeLocal(utcDate: Date | string, timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const localDate = toZonedTime(date, tz);
  
  // Format as "YYYY-MM-DDTHH:mm" for datetime-local input
  return format(localDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Validate lead time (e.g., must book at least 24 hours in advance)
 */
export function validateLeadTime(startTime: Date | string, hoursRequired: number = 24): boolean {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const now = new Date();
  const requiredTime = new Date(now.getTime() + hoursRequired * 60 * 60 * 1000);
  return start >= requiredTime;
}

/**
 * Get available time slots from availability slots
 */
export function getAvailableTimeSlots(
  availabilitySlots: Array<{ start_time: string; end_time: string; status: string }>,
  date: Date,
  timezone?: string
): Array<{ start: Date; end: Date; label: string }> {
  const tz = timezone || getUserTimezone();
  const { start: dayStart, end: dayEnd } = getDateRangeUTC(date, tz);
  
  const slots: Array<{ start: Date; end: Date; label: string }> = [];
  
  availabilitySlots.forEach((slot) => {
    if (slot.status !== 'open') return;
    
    const slotStart = parseISO(slot.start_time);
    const slotEnd = parseISO(slot.end_time);
    
    // Check if slot is within the selected day
    if (slotStart >= dayStart && slotStart < dayEnd) {
      const timeSlots = generate30MinuteSlots(slotStart, slotEnd);
      
      timeSlots.forEach((timeSlot) => {
        const slotEndTime = addMinutes(timeSlot, 30);
        if (slotEndTime <= slotEnd && !isPastDate(timeSlot)) {
          slots.push({
            start: timeSlot,
            end: slotEndTime,
            label: formatInUserTimezone(timeSlot, 'h:mm a', tz),
          });
        }
      });
    }
  });
  
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
