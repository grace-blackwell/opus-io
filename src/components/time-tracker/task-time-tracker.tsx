'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Clock } from 'lucide-react'
import { formatTime, getElapsedSeconds } from '@/lib/time-utils'
import { Task } from '@prisma/client'
import { toast } from 'sonner'

interface TaskTimeTrackerProps {
  task: Task
  onTimeUpdate?: (task: Task) => void
}

export default function TaskTimeTracker({ task, onTimeUpdate }: TaskTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(task.isTracking)
  const [elapsedTime, setElapsedTime] = useState(task.totalTrackedTime)
  const [loading, setLoading] = useState(false)

  // Update the timer every second when tracking
  useEffect(() => {
    if (!isTracking) return

    const interval = setInterval(() => {
      const additionalSeconds = getElapsedSeconds(task.trackedStartTime)
      setElapsedTime(task.totalTrackedTime + additionalSeconds)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTracking, task.trackedStartTime, task.totalTrackedTime])

  // Update the tracking state when the task prop changes
  useEffect(() => {
    setIsTracking(task.isTracking)
    
    if (!task.isTracking) {
      setElapsedTime(task.totalTrackedTime)
    } else {
      const additionalSeconds = getElapsedSeconds(task.trackedStartTime)
      setElapsedTime(task.totalTrackedTime + additionalSeconds)
    }
  }, [task])

  const handleStartTracking = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${task.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })

      if (!response.ok) {
        throw new Error('Failed to start time tracking')
      }

      const updatedTask = await response.json()
      setIsTracking(true)
      
      if (onTimeUpdate) {
        onTimeUpdate(updatedTask)
      }
      
      toast.success('Time tracking started')
    } catch (error) {
      console.error('Error starting time tracking:', error)
      toast.error('Failed to start time tracking')
    } finally {
      setLoading(false)
    }
  }

  const handleStopTracking = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${task.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      })

      if (!response.ok) {
        throw new Error('Failed to stop time tracking')
      }

      const updatedTask = await response.json()
      setIsTracking(false)
      setElapsedTime(updatedTask.totalTrackedTime)
      
      if (onTimeUpdate) {
        onTimeUpdate(updatedTask)
      }
      
      toast.success('Time tracking stopped')
    } catch (error) {
      console.error('Error stopping time tracking:', error)
      toast.error('Failed to stop time tracking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock size={14} />
        <span>{formatTime(elapsedTime)}</span>
      </div>
      
      {isTracking ? (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleStopTracking}
          disabled={loading}
          className="h-7 px-2"
        >
          <Square size={14} className="mr-1" />
          Stop
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleStartTracking}
          disabled={loading}
          className="h-7 px-2"
        >
          <Play size={14} className="mr-1" />
          Start
        </Button>
      )}
    </div>
  )
}