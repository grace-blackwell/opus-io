import { NextRequest, NextResponse } from "next/server";
import { startTaskTimeTracking, stopTaskTimeTracking } from "@/lib/queries";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { action, description } = await req.json();
    const parameters = await params;
    const { taskId } = parameters;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (action === "start") {
      const task = await startTaskTimeTracking(taskId);
      return NextResponse.json(task);
    } else if (action === "stop") {
      // First stop the time tracking
      const task = await stopTaskTimeTracking(taskId);
      
      // If a description was provided, update the most recent time entry
      if (description) {
        // First find the most recent time entry
        const recentEntries = await db.timeEntry.findMany({
          where: {
            taskId,
            endTime: {
              not: null
            }
          },
          orderBy: {
            endTime: 'desc'
          },
          take: 1
        });
        
        // If we found an entry, update it
        if (recentEntries.length > 0) {
          await db.timeEntry.update({
            where: {
              id: recentEntries[0].id
            },
            data: {
              description
            }
          });
        }
      }
      
      return NextResponse.json(task);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in time tracking API:", error);
    return NextResponse.json(
      { error: "Failed to process time tracking request" },
      { status: 500 }
    );
  }
}