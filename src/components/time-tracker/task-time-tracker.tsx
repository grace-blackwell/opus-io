'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Clock, MessageSquare, AlertCircle } from 'lucide-react'
import { formatTime, getElapsedSeconds } from '@/lib/time-utils'
import { Task } from '@prisma/client'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TaskTimeTrackerProps {
  task: Task
  onTimeUpdate?: (task: Task) => void
}

export default function TaskTimeTracker({ task, onTimeUpdate }: TaskTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(task.isTracking)
  const [elapsedTime, setElapsedTime] = useState(task.totalTrackedTime || 0)
  const [loading, setLoading] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [description, setDescription] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isTrackingRef = useRef(task.isTracking)
  const taskRef = useRef(task)

  useEffect(() => {
    isTrackingRef.current = isTracking
  }, [isTracking])
  
  useEffect(() => {
    taskRef.current = task
  }, [task])

  const refreshTaskState = async () => {
    try {
      if (loading) return;
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const updatedTask = await response.json();

        taskRef.current = updatedTask;

        if (updatedTask.isTracking !== isTrackingRef.current) {
          setIsTracking(updatedTask.isTracking);

          if (!updatedTask.isTracking) {
            setElapsedTime(updatedTask.totalTrackedTime || 0);
          } else {
            try {
              const additionalSeconds = getElapsedSeconds(updatedTask.trackedStartTime);
              setElapsedTime((updatedTask.totalTrackedTime || 0) + additionalSeconds);
            } catch (err) {
              console.error('Error calculating elapsed time:', err);
              setElapsedTime(updatedTask.totalTrackedTime || 0);
            }
          }

          if (onTimeUpdate) {
            onTimeUpdate(updatedTask);
          }
        } else if (updatedTask.isTracking) {
          try {
            const additionalSeconds = getElapsedSeconds(updatedTask.trackedStartTime);
            setElapsedTime((updatedTask.totalTrackedTime || 0) + additionalSeconds);
          } catch (err) {
            console.error('Error calculating elapsed time:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing task state:', error);
    }
  };

  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    refreshTaskState();

    refreshIntervalRef.current = setInterval(() => {
      refreshTaskState();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTaskState();
      }
    };

    const handleFocus = () => {
      refreshTaskState();
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
  }, [task.id]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (isTracking) {
      timerRef.current = setInterval(() => {
        try {
          const currentTask = taskRef.current
          if (currentTask && currentTask.trackedStartTime) {
            const additionalSeconds = getElapsedSeconds(currentTask.trackedStartTime)
            setElapsedTime((currentTask.totalTrackedTime || 0) + additionalSeconds)
          }
        } catch (error) {
          console.error('Error updating timer:', error)
        }
      }, 1000)

      try {
        const additionalSeconds = getElapsedSeconds(task.trackedStartTime)
        setElapsedTime((task.totalTrackedTime || 0) + additionalSeconds)
      } catch (error) {
        console.error('Error setting initial elapsed time:', error)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isTracking])

  useEffect(() => {
    if (isTracking !== task.isTracking) {
      setIsTracking(task.isTracking)
    }
    
    try {
      if (!task.isTracking) {
        setElapsedTime(task.totalTrackedTime || 0)
      } else {
        const additionalSeconds = getElapsedSeconds(task.trackedStartTime)
        setElapsedTime((task.totalTrackedTime || 0) + additionalSeconds)
      }
    } catch (error) {
      console.error('Error updating elapsed time:', error)
      setElapsedTime(task.totalTrackedTime || 0)
    }
  }, [task, task.isTracking, task.totalTrackedTime, task.trackedStartTime])

  const handleStartTracking = async () => {
    try {
      if (loading) return;
      
      setLoading(true);
      
      const response = await fetch(`/api/tasks/${task.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start time tracking');
      }

      const updatedTask = await response.json();

      setIsTracking(true);
      taskRef.current = updatedTask;

      try {
        const additionalSeconds = getElapsedSeconds(updatedTask.trackedStartTime);
        setElapsedTime((updatedTask.totalTrackedTime || 0) + additionalSeconds);
      } catch (err) {
        console.error('Error calculating initial elapsed time:', err);
        setElapsedTime(updatedTask.totalTrackedTime || 0);
      }
      
      // Notify parent component
      if (onTimeUpdate) {
        onTimeUpdate(updatedTask);
      }
      
      toast.success('Time tracking started');
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error('Failed to start time tracking');
    } finally {
      setLoading(false);
    }
  }

  const handleStopClick = () => {
    setShowStopDialog(true)
  }

  const handleCancelStop = () => {
    setShowStopDialog(false)
    setDescription('')
  }

  const handleStopTracking = async () => {
    try {
      if (loading) return;
      
      setLoading(true);

      const requestBody = { 
        action: 'stop',
        description: ''
      };

      if (description.trim()) {
        requestBody['description'] = description.trim();
      }
      
      const response = await fetch(`/api/tasks/${task.id}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to stop time tracking');
      }

      const updatedTask = await response.json();

      setIsTracking(false);
      isTrackingRef.current = false;
      taskRef.current = updatedTask;
      setElapsedTime(updatedTask.totalTrackedTime || 0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onTimeUpdate) {
        onTimeUpdate(updatedTask);
      }
      
      toast.success('Time tracking stopped');
      setShowStopDialog(false);
      setDescription('');

      setTimeout(() => {
        refreshTaskState();
      }, 500);
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error('Failed to stop time tracking');

      setTimeout(() => {
        refreshTaskState();
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 pt-2">
        <div className="flex items-center gap-1 text-sm text-base-content">
          <Clock size={14} />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                {isTracking ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleStopClick}
                    disabled={loading}
                    className="h-5 px-1 rounded-none"
                  >
                    <Square size={14} />
                    Stop
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStartTracking}
                    disabled={loading}
                    className="h-5 px-1 rounded-none text-base-content"
                  >
                    <Play size={14} className={'text-green-600'}/>
                    Start
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-1 max-w-xs">
                <AlertCircle size={14} className="text-amber-500" />
                <p className="text-xs">Starting task time tracking will stop any active project timer.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Time Tracking</DialogTitle>
            <DialogDescription>
              Add a description of what you worked on (optional)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStop} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleStopTracking} disabled={loading}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Stop and Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}