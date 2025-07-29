import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';

export interface DateRange {
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * Formats a date range for display
 */
export function formatDateRange(startDateTime: string, endDateTime?: string | null): string {
  const start = parseISO(startDateTime);
  
  if (!endDateTime) {
    // Single day event
    return format(start, 'MMM dd, yyyy');
  }
  
  const end = parseISO(endDateTime);
  
  if (isSameDay(start, end)) {
    // Same day, different times
    return format(start, 'MMM dd, yyyy');
  }
  
  const daysDiff = differenceInDays(end, start);
  
  if (daysDiff <= 7) {
    // Multi-day event within a week
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  }
  
  // Long duration event
  return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
}

/**
 * Formats a time range for display
 */
export function formatTimeRange(startDateTime: string, endDateTime?: string | null): string {
  const start = parseISO(startDateTime);
  
  if (!endDateTime) {
    return format(start, 'p');
  }
  
  const end = parseISO(endDateTime);
  
  if (isSameDay(start, end)) {
    return `${format(start, 'p')} - ${format(end, 'p')}`;
  }
  
  // Multi-day event
  return `${format(start, 'p')} (Day 1)`;
}

/**
 * Formats a complete date and time range for display
 */
export function formatEventDuration(startDateTime: string, endDateTime?: string | null): {
  dateRange: string;
  timeRange: string;
  isMultiDay: boolean;
} {
  const start = parseISO(startDateTime);
  const isMultiDay = endDateTime ? !isSameDay(start, parseISO(endDateTime)) : false;
  
  return {
    dateRange: formatDateRange(startDateTime, endDateTime),
    timeRange: formatTimeRange(startDateTime, endDateTime),
    isMultiDay
  };
}

/**
 * Creates ISO date string from date and time strings
 */
export function createDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

/**
 * Extracts date and time from ISO string
 */
export function extractDateAndTime(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  return {
    date: format(date, 'yyyy-MM-dd'),
    time: format(date, 'HH:mm')
  };
}