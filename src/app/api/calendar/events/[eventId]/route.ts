import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET: Fetch a specific calendar event
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { userId } = await auth();
    const parameters = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const eventId = parameters.eventId;

    // Get the account ID for the current user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Account: true },
    });

    if (!user || !user.Account) {
      return new NextResponse("Account not found", { status: 404 });
    }

    const accountId = user.Account.id;

    // Get the event, ensuring it belongs to the current user's account
    const event = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        accountId,
      },
    });

    if (!event) {
      return new NextResponse("Event not found", { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[CALENDAR_EVENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH: Update a calendar event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { userId } = await auth();
    const parameters = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const eventId = parameters.eventId;
    const body = await req.json();
    const { title, start, end, allDay } = body;

    // Get the account ID for the current user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Account: true },
    });

    if (!user || !user.Account) {
      return new NextResponse("Account not found", { status: 404 });
    }

    const accountId = user.Account.id;

    // Update the event, ensuring it belongs to the current user's account
    const updatedEvent = await db.calendarEvent.updateMany({
      where: {
        id: eventId,
        accountId,
      },
      data: {
        title: title,
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        allDay: allDay !== undefined ? allDay : undefined,
      },
    });

    if (updatedEvent.count === 0) {
      return new NextResponse("Event not found or unauthorized", {
        status: 404,
      });
    }

    // Get the updated event
    const event = await db.calendarEvent.findUnique({
      where: { id: eventId },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[CALENDAR_EVENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE: Remove a calendar event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { userId } = await auth();
    const parameters = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const eventId = parameters.eventId;

    // Get the account ID for the current user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { Account: true },
    });

    if (!user || !user.Account) {
      return new NextResponse("Account not found", { status: 404 });
    }

    const accountId = user.Account.id;

    // Delete the event, ensuring it belongs to the current user's account
    const deletedEvent = await db.calendarEvent.deleteMany({
      where: {
        id: eventId,
        accountId,
      },
    });

    if (deletedEvent.count === 0) {
      return new NextResponse("Event not found or unauthorized", {
        status: 404,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CALENDAR_EVENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
