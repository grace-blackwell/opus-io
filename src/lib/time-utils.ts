/**
 * Formats seconds into a human-readable time string (HH:MM:SS or MM:SS)
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Formats seconds into a human-readable duration (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0m';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Calculates the elapsed time in seconds from a start time to now
 */
export function getElapsedSeconds(startTime: Date | null | undefined): number {
  if (!startTime) return 0;
  
  try {
    const now = new Date();
    // Ensure startTime is a valid Date object
    const startTimeDate = startTime instanceof Date ? startTime : new Date(startTime);
    return Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
  } catch (error) {
    console.error('Error calculating elapsed time:', error);
    return 0;
  }
}