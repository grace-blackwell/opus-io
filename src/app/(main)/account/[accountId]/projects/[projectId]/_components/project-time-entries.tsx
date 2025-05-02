'use client'

import { useEffect, useState } from 'react'
import { TimeEntry } from '@prisma/client'
import { format } from 'date-fns'
import { formatDuration } from '@/lib/time-utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ProjectTimeEntriesProps {
  projectId: string
}

interface TimeEntryWithTask extends TimeEntry {
  Task?: {
    name: string
  }
}

export default function ProjectTimeEntries({ projectId }: ProjectTimeEntriesProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}/time-entries`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch time entries')
        }
        
        const data = await response.json()
        setTimeEntries(data)
      } catch (error) {
        console.error('Error fetching time entries:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeEntries()
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (timeEntries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No time entries recorded yet
      </div>
    )
  }

  // Only show the 5 most recent entries
  const recentEntries = timeEntries.slice(0, 5)

  return (
    <div className="space-y-3">
      {recentEntries.map((entry) => (
        <div key={entry.id} className="border-b pb-3">
          <div className="flex justify-between">
            <div>
              <p className="font-medium text-sm">
                {entry.Task?.name || 'Unnamed Task'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.startTime), 'MMM dd, yyyy • h:mm a')}
              </p>
            </div>
            <div className="text-sm font-medium">
              {entry.duration ? formatDuration(entry.duration) : 'In progress'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}