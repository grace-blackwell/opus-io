'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Clock, AlertCircle } from 'lucide-react'
import { formatTime, formatDuration, getElapsedSeconds } from '@/lib/time-utils'
import { Project } from '@prisma/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProjectTimeTrackerProps {
  project: Project
  onTimeUpdate?: (project: Project) => void
}

export default function ProjectTimeTracker({ project, onTimeUpdate }: ProjectTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(project.isTracking)
  const [elapsedTime, setElapsedTime] = useState(project.totalTrackedTime || 0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use refs to store the current values for use in intervals
  const isTrackingRef = useRef(project.isTracking)
  const projectRef = useRef(project)
  
  // Update refs when state changes
  useEffect(() => {
    isTrackingRef.current = isTracking
  }, [isTracking])
  
  useEffect(() => {
    projectRef.current = project
  }, [project])

  // Fetch the latest project state
  const refreshProjectState = async () => {
    try {
      // Don't refresh if we're in the middle of loading
      if (loading) return;
      
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting to prevent stale data
        cache: 'no-store',
      });

      if (response.ok) {
        const updatedProject = await response.json();
        
        // Update the project ref
        projectRef.current = updatedProject;
        
        // Update tracking state if it has changed
        if (updatedProject.isTracking !== isTrackingRef.current) {
          setIsTracking(updatedProject.isTracking);
          
          // Update elapsed time based on tracking state
          if (!updatedProject.isTracking) {
            setElapsedTime(updatedProject.totalTrackedTime || 0);
          } else {
            try {
              const additionalSeconds = getElapsedSeconds(updatedProject.trackedStartTime);
              setElapsedTime((updatedProject.totalTrackedTime || 0) + additionalSeconds);
            } catch (err) {
              console.error('Error calculating elapsed time:', err);
              setElapsedTime(updatedProject.totalTrackedTime || 0);
            }
          }
          
          // Notify parent component if callback exists
          if (onTimeUpdate) {
            onTimeUpdate(updatedProject);
          }
        } else if (updatedProject.isTracking) {
          // Even if tracking state hasn't changed, update the elapsed time if we're tracking
          try {
            const additionalSeconds = getElapsedSeconds(updatedProject.trackedStartTime);
            setElapsedTime((updatedProject.totalTrackedTime || 0) + additionalSeconds);
          } catch (err) {
            console.error('Error calculating elapsed time:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing project state:', error);
      // Don't update state on error to avoid disrupting the UI
    }
  };

  // Set up periodic refresh of project state
  useEffect(() => {
    // Clear any existing refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Initial refresh
    refreshProjectState();
    
    // Set up interval for periodic refreshes (every 5 seconds)
    refreshIntervalRef.current = setInterval(() => {
      refreshProjectState();
    }, 5000);
    
    // Also refresh when the component becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediate refresh when tab becomes visible
        refreshProjectState();
      }
    };
    
    // Also refresh on focus
    const handleFocus = () => {
      refreshProjectState();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [project.id]);

  // Update the timer every second when tracking
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Only set up the timer if we're tracking
    if (isTracking) {
      // Start a new timer that updates every second
      timerRef.current = setInterval(() => {
        try {
          // Use the current project from the ref to avoid stale closures
          const currentProject = projectRef.current
          if (currentProject && currentProject.trackedStartTime) {
            const additionalSeconds = getElapsedSeconds(currentProject.trackedStartTime)
            setElapsedTime((currentProject.totalTrackedTime || 0) + additionalSeconds)
          }
        } catch (error) {
          console.error('Error updating timer:', error)
          // Don't update on error to avoid disrupting the UI
        }
      }, 1000)
      
      // Force an immediate update when starting
      try {
        const additionalSeconds = getElapsedSeconds(project.trackedStartTime)
        setElapsedTime((project.totalTrackedTime || 0) + additionalSeconds)
      } catch (error) {
        console.error('Error setting initial elapsed time:', error)
      }
    }

    // Clean up the timer when the component unmounts or when tracking stops
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isTracking])

  // Update the tracking state when the project prop changes
  useEffect(() => {
    // Only update if the tracking state has actually changed
    if (isTracking !== project.isTracking) {
      setIsTracking(project.isTracking)
    }
    
    try {
      if (!project.isTracking) {
        // If not tracking, just show the total time
        setElapsedTime(project.totalTrackedTime || 0)
      } else {
        // If tracking, calculate and show the current elapsed time
        const additionalSeconds = getElapsedSeconds(project.trackedStartTime)
        setElapsedTime((project.totalTrackedTime || 0) + additionalSeconds)
      }
    } catch (error) {
      console.error('Error updating elapsed time:', error)
      setElapsedTime(project.totalTrackedTime || 0)
    }
  }, [project, project.isTracking, project.totalTrackedTime, project.trackedStartTime])

  const handleStartTracking = async () => {
    try {
      // Prevent multiple clicks
      if (loading) return;
      
      setLoading(true);
      
      const response = await fetch(`/api/projects/${project.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start project time tracking');
      }

      const updatedProject = await response.json();
      
      // Update local state
      setIsTracking(true);
      isTrackingRef.current = true;
      projectRef.current = updatedProject;
      
      // Calculate initial elapsed time
      try {
        const additionalSeconds = getElapsedSeconds(updatedProject.trackedStartTime);
        setElapsedTime((updatedProject.totalTrackedTime || 0) + additionalSeconds);
      } catch (err) {
        console.error('Error calculating initial elapsed time:', err);
        setElapsedTime(updatedProject.totalTrackedTime || 0);
      }
      
      // Notify parent component
      if (onTimeUpdate) {
        onTimeUpdate(updatedProject);
      }
      
      toast.success('Project time tracking started');
      
      // Force a refresh to ensure we have the latest data
      setTimeout(() => {
        refreshProjectState();
      }, 500);
    } catch (error) {
      console.error('Error starting project time tracking:', error);
      toast.error('Failed to start project time tracking');
      
      // Try to refresh the state to recover
      setTimeout(() => {
        refreshProjectState();
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  const handleStopTracking = async () => {
    try {
      // Prevent multiple clicks
      if (loading) return;
      
      setLoading(true);
      
      const response = await fetch(`/api/projects/${project.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to stop project time tracking');
      }

      const updatedProject = await response.json();
      
      // Update local state and refs
      setIsTracking(false);
      isTrackingRef.current = false;
      projectRef.current = updatedProject;
      setElapsedTime(updatedProject.totalTrackedTime || 0);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Notify parent component
      if (onTimeUpdate) {
        onTimeUpdate(updatedProject);
      }
      
      toast.success('Project time tracking stopped');
      
      // Force a refresh to ensure we have the latest data
      setTimeout(() => {
        refreshProjectState();
      }, 500);
    } catch (error) {
      console.error('Error stopping project time tracking:', error);
      toast.error('Failed to stop project time tracking');
      
      // Try to refresh the state to recover
      setTimeout(() => {
        refreshProjectState();
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  // Convert seconds to hours for display
  const totalHours = elapsedTime / 3600;

  return (
    <Card className={'bg-background border-none rounded-none'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Time Tracking
          </div>
          <div className="text-2xl font-bold text-primary">
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
          
          <div className="flex flex-col gap-4">
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
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Starting project time tracking will stop any active task timers. You can track time at either the project level or for individual tasks, but not both simultaneously.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}