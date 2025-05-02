import { NextRequest, NextResponse } from "next/server";
import { startTaskTimeTracking, stopTaskTimeTracking } from "@/lib/queries";

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { action } = await req.json();
    const { taskId } = params;

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
      const task = await stopTaskTimeTracking(taskId);
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