import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId");
    const contactId = url.searchParams.get("contactId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const whereClause: Prisma.ProjectWhereInput = {
      accountId: accountId,
    };

    // If contactId is provided, filter projects by contact
    if (contactId) {
      whereClause.contactId = contactId;
    }

    const projects = await db.project.findMany({
      where: whereClause,
      orderBy: {
        projectTitle: "asc",
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
