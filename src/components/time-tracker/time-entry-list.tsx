'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/time-utils'
import { format } from 'date-fns'
import { TimeEntry } from '@prisma/client'
import { Clock } from 'lucide-react'

interface TimeEntryWithTask extends TimeEntry {
  Task?: {
    name: string
  }
}

interface TimeEntryListProps {
  projectId?: string
  taskId?: string
}

export default function TimeEntryList({ projectId, taskId }: TimeEntryListProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true)
        let url = ''
        
        if (projectId) {
          url = `/api/projects/${projectId}/time-entries`
        } else if (taskId) {
          url = `/api/tasks/${taskId}/time-entries`
        } else {
          return
        }
        
        const response = await fetch(url)
        
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
  }, [projectId, taskId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Loading time entries...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (timeEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>No time entries found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Entries
        </CardTitle>
        <CardDescription>
          {projectId ? 'Recent time entries for this project' : 'Recent time entries for this task'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center border-b pb-3">
              <div>
                {entry.Task && (
                  <p className="text-sm font-medium">{entry.Task.name}</p>
                )}
                <p className="text-sm">
                  {format(new Date(entry.startTime), 'MMM dd, yyyy • h:mm a')}
                  {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                </p>
                {entry.description && (
                  <p className="text-sm mt-1italic">"{entry.description}"</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {entry.duration ? formatDuration(entry.duration) : 'In progress'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}