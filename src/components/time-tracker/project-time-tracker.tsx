'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Clock } from 'lucide-react'
import { formatTime, formatDuration, getElapsedSeconds } from '@/lib/time-utils'
import { Project } from '@prisma/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectTimeTrackerProps {
  project: Project
  onTimeUpdate?: (project: Project) => void
}

export default function ProjectTimeTracker({ project, onTimeUpdate }: ProjectTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(project.isTracking)
  const [elapsedTime, setElapsedTime] = useState(project.totalTrackedTime)
  const [loading, setLoading] = useState(false)

  // Update the timer every second when tracking
  useEffect(() => {
    if (!isTracking) return

    const interval = setInterval(() => {
      const additionalSeconds = getElapsedSeconds(project.trackedStartTime)
      setElapsedTime(project.totalTrackedTime + additionalSeconds)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTracking, project.trackedStartTime, project.totalTrackedTime])

  // Update the tracking state when the project prop changes
  useEffect(() => {
    setIsTracking(project.isTracking)
    
    if (!project.isTracking) {
      setElapsedTime(project.totalTrackedTime)
    } else {
      const additionalSeconds = getElapsedSeconds(project.trackedStartTime)
      setElapsedTime(project.totalTrackedTime + additionalSeconds)
    }
  }, [project])

  const handleStartTracking = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })

      if (!response.ok) {
        throw new Error('Failed to start project time tracking')
      }

      const updatedProject = await response.json()
      setIsTracking(true)
      
      if (onTimeUpdate) {
        onTimeUpdate(updatedProject)
      }
      
      toast.success('Project time tracking started')
    } catch (error) {
      console.error('Error starting project time tracking:', error)
      toast.error('Failed to start project time tracking')
    } finally {
      setLoading(false)
    }
  }

  const handleStopTracking = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      })

      if (!response.ok) {
        throw new Error('Failed to stop project time tracking')
      }

      const updatedProject = await response.json()
      setIsTracking(false)
      setElapsedTime(updatedProject.totalTrackedTime)
      
      if (onTimeUpdate) {
        onTimeUpdate(updatedProject)
      }
      
      toast.success('Project time tracking stopped')
    } catch (error) {
      console.error('Error stopping project time tracking:', error)
      toast.error('Failed to stop project time tracking')
    } finally {
      setLoading(false)
    }
  }

  // Convert seconds to hours for display
  const totalHours = elapsedTime / 3600;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </div>
          <div className="text-2xl font-bold">
            {formatTime(elapsedTime)}
          </div>
        </CardTitle>
        <CardDescription>
          Track time for all tasks in this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Time</p>
              <p className="text-lg font-semibold">{formatDuration(elapsedTime)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
              <p className="text-lg font-semibold">{totalHours.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            {isTracking ? (
              <Button 
                variant="destructive" 
                onClick={handleStopTracking}
                disabled={loading}
                className="w-full"
              >
                <Square size={16} className="mr-2" />
                Stop Tracking
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={handleStartTracking}
                disabled={loading}
                className="w-full"
              >
                <Play size={16} className="mr-2" />
                Start Tracking
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}