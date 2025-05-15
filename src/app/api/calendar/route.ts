import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET: Fetch calendar and events for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the account ID for the current user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Account: true },
    });

    if (!user || !user.Account) {
      return new NextResponse("Account not found", { status: 404 });
    }

    const accountId = user.Account.id;

    // Find or create a calendar for this account
    let calendar = await db.calendar.findUnique({
      where: { accountId },
      include: { calendarEvents: true },
    });

    if (!calendar) {
      // Create a new calendar if one doesn't exist
      calendar = await db.calendar.create({
        data: {
          accountId,
        },
        include: { calendarEvents: true },
      });
    }

    return NextResponse.json(calendar);
  } catch (error) {
    console.error("[CALENDAR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new calendar if one doesn't exist
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the account ID for the current user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Account: true },
    });

    if (!user || !user.Account) {
      return new NextResponse("Account not found", { status: 404 });
    }

    const accountId = user.Account.id;

    // Check if a calendar already exists
    const existingCalendar = await db.calendar.findUnique({
      where: { accountId },
    });

    if (existingCalendar) {
      return NextResponse.json(existingCalendar);
    }

    // Create a new calendar
    const calendar = await db.calendar.create({
      data: {
        accountId,
      },
    });

    return NextResponse.json(calendar);
  } catch (error) {
    console.error("[CALENDAR_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
