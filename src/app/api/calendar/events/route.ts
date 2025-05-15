import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET: Fetch all calendar events for the current user
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

    // Find the calendar for this account
    const calendar = await db.calendar.findUnique({
      where: { accountId },
    });

    if (!calendar) {
      return new NextResponse("Calendar not found", { status: 404 });
    }

    // Get all events for this calendar
    const events = await db.calendarEvent.findMany({
      where: { calendarId: calendar.id },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[CALENDAR_EVENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new calendar event
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, start, end, allDay } = body;

    if (!title || !start || !end) {
      return new NextResponse("Missing required fields", { status: 400 });
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
    });

    if (!calendar) {
      calendar = await db.calendar.create({
        data: {
          accountId,
        },
      });
    }

    // Create the new event
    const event = await db.calendarEvent.create({
      data: {
        title,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
        accountId,
        calendarId: calendar.id,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[CALENDAR_EVENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
