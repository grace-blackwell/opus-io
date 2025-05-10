"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimeEntry } from "@prisma/client";
import { format, addDays, differenceInDays, startOfDay } from "date-fns";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  TooltipProps,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface ProjectGanttChartProps {
  projectId: string;
}

interface TimeEntryWithTask extends TimeEntry {
  Task?: {
    id: string;
    name: string;
  };
  Project?: {
    id: string;
    projectTitle: string;
  };
}

interface ProjectTask {
  id: string;
  name: string;
  entries: TimeEntryWithTask[];
}

interface ProjectTaskData {
  id: string;
  name: string;
}

interface GanttChartData {
  task: string;
  taskId: string;
  start: number;
  duration: number;
  startDate: Date;
  endDate: Date;
  actualDuration: number; // Total duration in seconds
  formattedDuration: string; // Formatted as HH:MM
}

interface CustomBarShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  payload: GanttChartData;
}

export default function ProjectGanttChart({
  projectId,
}: ProjectGanttChartProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [chartData, setChartData] = useState<GanttChartData[]>([]);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true);

        // Fetch all tasks for this project
        const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);

        if (!tasksResponse.ok) {
          throw new Error("Failed to fetch project tasks");
        }

        const tasksData = await tasksResponse.json();

        // Fetch time entries
        const timeEntriesResponse = await fetch(
          `/api/projects/${projectId}/time-entries`
        );

        if (!timeEntriesResponse.ok) {
          throw new Error("Failed to fetch time entries");
        }

        const timeEntriesData = await timeEntriesResponse.json();
        setTimeEntries(timeEntriesData);

        // Create a map of all tasks with their time entries
        const taskMap = new Map<string, ProjectTask>();

        // First, add all tasks from the project
        tasksData.forEach((task: ProjectTaskData) => {
          taskMap.set(task.id, {
            id: task.id,
            name: task.name,
            entries: [],
          });
        });

        // Then, add all time entries to their respective tasks
        timeEntriesData.forEach((entry: TimeEntryWithTask) => {
          if (entry.taskId && entry.Task) {
            // Task-level time entry
            if (!taskMap.has(entry.taskId)) {
              // If the task doesn't exist in our map (might be deleted), create it
              taskMap.set(entry.taskId, {
                id: entry.taskId,
                name: entry.Task.name || "Unknown Task",
                entries: [],
              });
            }
            taskMap.get(entry.taskId)?.entries.push(entry);
          } else if (entry.projectId && entry.Project && !entry.taskId) {
            // Project-level time entry
            taskMap.get("project-overview")?.entries.push(entry);
          }
        });

        // Filter out tasks with no time entries
        const tasksWithEntries = Array.from(taskMap.values()).filter(
          (task) => task.entries.length > 0
        );

        setProjectTasks(tasksWithEntries);

        // Process the data to find start and end dates
        if (timeEntriesData.length > 0) {
          // Find the earliest start time
          const sortedByStart = [...timeEntriesData].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

          // Find the latest end time
          const sortedByEnd = [...timeEntriesData].sort((a, b) => {
            const aEnd = a.endTime
              ? new Date(a.endTime).getTime()
              : new Date().getTime();
            const bEnd = b.endTime
              ? new Date(b.endTime).getTime()
              : new Date().getTime();
            return bEnd - aEnd;
          });

          // Set the start date to the beginning of the day of the earliest entry
          const firstDay = startOfDay(new Date(sortedByStart[0].startTime));
          setStartDate(firstDay);

          // Set the end date to today or the latest end time, whichever is later
          const latestEnd = sortedByEnd[0].endTime
            ? new Date(sortedByEnd[0].endTime)
            : new Date();

          // Add one day to ensure we include the full last day
          const lastDay = addDays(startOfDay(latestEnd), 1);
          setEndDate(lastDay);

          // Create chart data for recharts
          const ganttData: GanttChartData[] = tasksWithEntries.map((task) => {
            const taskStartDates = task.entries.map((entry) =>
              startOfDay(new Date(entry.startTime))
            );
            const taskEndDates = task.entries.map((entry) =>
              entry.endTime
                ? startOfDay(new Date(entry.endTime))
                : startOfDay(new Date())
            );

            // Find the earliest start and latest end for this task
            const earliestStart = new Date(
              Math.min(...taskStartDates.map((d) => d.getTime()))
            );
            const latestEnd = new Date(
              Math.max(...taskEndDates.map((d) => d.getTime()))
            );

            // Calculate position and width for the bar (still using date range for visual positioning)
            const startOffset = differenceInDays(earliestStart, firstDay);
            const duration = differenceInDays(latestEnd, earliestStart) + 1;

            // Calculate actual tracked time by summing up durations from time entries
            const actualDuration = task.entries.reduce((total, entry) => {
              // If duration is directly available, use it
              if (entry.duration) {
                return total + entry.duration;
              }

              // Otherwise calculate from start and end times
              if (entry.startTime && entry.endTime) {
                const start = new Date(entry.startTime).getTime();
                const end = new Date(entry.endTime).getTime();
                return total + Math.floor((end - start) / 1000); // Convert ms to seconds
              }

              return total;
            }, 0);

            // Format the duration as HH:MM
            const hours = Math.floor(actualDuration / 3600);
            const minutes = Math.floor((actualDuration % 3600) / 60);
            const formattedDuration = `${hours}:${minutes
              .toString()
              .padStart(2, "0")}`;

            return {
              task: task.name,
              taskId: task.id,
              start: startOffset,
              duration: duration,
              startDate: earliestStart,
              endDate: latestEnd,
              actualDuration: actualDuration,
              formattedDuration: formattedDuration,
            };
          });

          // Sort tasks by start date
          ganttData.sort((a, b) => a.start - b.start);

          setChartData(ganttData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Loading timeline data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (
    timeEntries.length === 0 ||
    !startDate ||
    !endDate ||
    projectTasks.length === 0
  ) {
    return (
      <Card className={"border-none"}>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Gantt Chart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No timeline data yet. Start tracking time on tasks to populate the
            Gantt chart.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate the number of days to display
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as GanttChartData;
      return (
        <div className="bg-background border border-border rounded-md p-2 shadow-md text-sm">
          <p className="font-bold">{data.task}</p>
          <p className="text-xs text-muted-foreground">
            {format(data.startDate, "MMM dd, yyyy")} -{" "}
            {format(data.endDate, "MMM dd, yyyy")}
          </p>
          <p className="text-xs mt-1">Tracked time: {data.formattedDuration}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={"bg-background border-none rounded-none shadow-none"}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>
              Gantt Chart showing {projectTasks.length} tasks with time entries
            </CardDescription>
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          <ResponsiveContainer width={"100%"} height={600}>
            <BarChart
              data={chartData}
              layout="vertical"
              barGap={5}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, totalDays]}
                orientation="top"
                tickFormatter={(value) => {
                  if (startDate && Number.isInteger(value)) {
                    const date = addDays(startDate, value);
                    return format(date, "MMM dd");
                  }
                  return "";
                }}
                fontSize={12}
                axisLine={true}
                tickLine={true}
                ticks={Array.from(
                  { length: totalDays + 1 },
                  (_, i) => i
                ).filter(
                  (i) => i % Math.ceil(totalDays / 10) === 0 || i === totalDays
                )}
              />
              <YAxis
                dataKey="task"
                type="category"
                width={200}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar
                dataKey="duration"
                stackId="a"
                fill="var(--secondary)"
                barSize={20}
                // Position the bars correctly based on start date
                shape={(props: unknown) => {
                  const typedProps = props as CustomBarShapeProps;
                  const { x, y, width, height, fill, payload } = typedProps;
                  const data = payload;
                  // Calculate the x position based on the start offset
                  const adjustedX = x + data.start * (width / data.duration);
                  const barWidth = (width / data.duration) * data.duration;

                  return (
                    <g>
                      <rect
                        x={adjustedX}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={fill}
                        rx={4}
                        ry={4}
                      />
                      {barWidth > 50 && (
                        <text
                          x={adjustedX + 8}
                          y={y + height / 2 + 4}
                          fill="white"
                          fontSize={11}
                          fontWeight="medium"
                          textAnchor="start"
                        >
                          {data.formattedDuration}
                        </text>
                      )}
                    </g>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
