import { NextRequest, NextResponse } from "next/server";
import { startProjectTimeTracking, stopProjectTimeTracking } from "@/lib/queries";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { action } = await req.json();
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (action === "start") {
      const project = await startProjectTimeTracking(projectId);
      return NextResponse.json(project);
    } else if (action === "stop") {
      const project = await stopProjectTimeTracking(projectId);
      return NextResponse.json(project);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in project time tracking API:", error);
    return NextResponse.json(
      { error: "Failed to process time tracking request" },
      { status: 500 }
    );
  }
}