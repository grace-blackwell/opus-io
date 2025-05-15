import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
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

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        notes: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ notes: project.notes || "" });
  } catch (error) {
    console.error("Error fetching project notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch project notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const parameters = await params;
    const { projectId } = parameters;
    const { notes } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const updatedProject = await db.project.update({
      where: {
        id: projectId,
      },
      data: {
        notes,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        notes: true,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project notes:", error);
    return NextResponse.json(
      { error: "Failed to update project notes" },
      { status: 500 }
    );
  }
}
