import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const parameters = await params;
    const { projectId } = parameters;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get all tasks for this project
    const tasks = await db.task.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        totalTrackedTime: true,
        isTracking: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tasks" },
      { status: 500 }
    );
  }
}
