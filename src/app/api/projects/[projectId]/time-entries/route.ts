import { NextRequest, NextResponse } from "next/server";
import { getTimeEntriesForProject } from "@/lib/queries";

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

    const timeEntries = await getTimeEntriesForProject(projectId);
    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Error fetching project time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch project time entries" },
      { status: 500 }
    );
  }
}