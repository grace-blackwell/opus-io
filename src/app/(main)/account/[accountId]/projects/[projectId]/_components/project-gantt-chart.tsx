'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeEntry } from '@prisma/client'
import { format, addDays, differenceInDays, startOfDay } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ProjectGanttChartProps {
  projectId: string
}

interface TimeEntryWithTask extends TimeEntry {
  Task?: {
    id: string
    name: string
  }
  Project?: {
    id: string
    projectTitle: string
  }
}

export default function ProjectGanttChart({ projectId }: ProjectGanttChartProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithTask[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [taskMap, setTaskMap] = useState<Map<string, { name: string, entries: TimeEntryWithTask[] }>>(new Map())

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

        // Process the data to find start and end dates
        if (data.length > 0) {
          // Find the earliest start time
          const sortedByStart = [...data].sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          
          // Find the latest end time
          const sortedByEnd = [...data].sort((a, b) => {
            const aEnd = a.endTime ? new Date(a.endTime).getTime() : new Date().getTime()
            const bEnd = b.endTime ? new Date(b.endTime).getTime() : new Date().getTime()
            return bEnd - aEnd
          })
          
          // Set the start date to the beginning of the day of the earliest entry
          setStartDate(startOfDay(new Date(sortedByStart[0].startTime)))
          
          // Set the end date to today or the latest end time, whichever is later
          const latestEnd = sortedByEnd[0].endTime 
            ? new Date(sortedByEnd[0].endTime) 
            : new Date()
          
          // Add one day to ensure we include the full last day
          setEndDate(addDays(startOfDay(latestEnd), 1))
          
          // Group entries by task or project (for project-level time tracking)
          const taskEntries = new Map<string, { name: string, entries: TimeEntryWithTask[] }>()
          
          data.forEach((entry: TimeEntryWithTask) => {
            if (entry.Task) {
              // Task-level time entry
              const taskId = entry.Task.id
              if (!taskEntries.has(taskId)) {
                taskEntries.set(taskId, { 
                  name: entry.Task.name,
                  entries: []
                })
              }
              taskEntries.get(taskId)?.entries.push(entry)
            } else if (entry.Project && !entry.taskId) {
              // Project-level time entry (create a special "Project Overview" task)
              const projectEntryId = 'project-overview'
              if (!taskEntries.has(projectEntryId)) {
                taskEntries.set(projectEntryId, { 
                  name: 'Project Overview',
                  entries: []
                })
              }
              taskEntries.get(projectEntryId)?.entries.push(entry)
            }
          })
          
          setTaskMap(taskEntries)
        }
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
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Loading timeline data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (timeEntries.length === 0 || !startDate || !endDate || taskMap.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Gantt Chart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No timeline data yet. Start tracking time on tasks to populate the Gantt chart.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate the number of days to display
  const totalDays = differenceInDays(endDate, startDate) + 1
  
  // Generate array of dates for the header
  const dateArray = Array.from({ length: totalDays }, (_, i) => 
    addDays(startDate, i)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Gantt Chart</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
              <span className="text-xs text-muted-foreground">Task Duration</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Chart header with dates */}
          <div className="flex border-b">
            <div className="w-1/4 min-w-[200px] p-2 font-medium">Task</div>
            <div className="w-3/4 flex">
              {dateArray.map((date, index) => (
                <div 
                  key={index} 
                  className="flex-1 p-2 text-center text-xs border-l"
                >
                  {format(date, 'MMM dd')}
                </div>
              ))}
            </div>
          </div>
          
          {/* Chart body with tasks and bars */}
          <div>
            {Array.from(taskMap.entries()).map(([taskId, { name, entries }]) => {
              // For each task, create a row with a bar spanning the days with time entries
              const taskStartDates = entries.map(entry => startOfDay(new Date(entry.startTime)))
              const taskEndDates = entries.map(entry => 
                entry.endTime ? startOfDay(new Date(entry.endTime)) : startOfDay(new Date())
              )
              
              // Find the earliest start and latest end for this task
              const earliestStart = new Date(Math.min(...taskStartDates.map(d => d.getTime())))
              const latestEnd = new Date(Math.max(...taskEndDates.map(d => d.getTime())))
              
              // Calculate position and width
              const startOffset = differenceInDays(earliestStart, startDate)
              const duration = differenceInDays(latestEnd, earliestStart) + 1
              
              return (
                <div key={taskId} className="flex border-b hover:bg-muted/30">
                  <div className="w-1/4 min-w-[200px] p-2 truncate">{name}</div>
                  <div className="w-3/4 flex relative py-2">
                    {dateArray.map((date, index) => (
                      <div 
                        key={index} 
                        className="flex-1 border-l"
                      />
                    ))}
                    
                    {/* Task bar with tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="absolute h-6 bg-primary/80 rounded-md top-1/2 -translate-y-1/2 flex items-center justify-center text-xs text-white font-medium px-2 overflow-hidden cursor-pointer"
                            style={{
                              left: `${(startOffset / totalDays) * 100}%`,
                              width: `${(duration / totalDays) * 100}%`,
                              minWidth: '20px' // Ensure very short tasks are still visible
                            }}
                          >
                            {duration > 2 && name}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm">
                            <p className="font-bold">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(earliestStart, 'MMM dd, yyyy')} - {format(latestEnd, 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs mt-1">Duration: {duration} day{duration !== 1 ? 's' : ''}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}