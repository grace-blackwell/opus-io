import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { EventInput } from "@fullcalendar/core";

// Define types for our calendar data
interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay: boolean;
  accountId: string;
  calendarId: string;
  details?: string;
}

interface Calendar {
  id: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  calendarEvents: CalendarEvent[];
}

// Convert a CalendarEvent to EventInput format for FullCalendar
const convertToEventInput = (event: CalendarEvent): EventInput => {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    extendedProps: {
      details: event.details || "",
    },
  };
};

// Convert an EventInput to the format expected by our API
const convertToApiFormat = (
  event: EventInput
): Omit<CalendarEvent, "id" | "accountId" | "calendarId"> => {
  // Convert DateInput to Date | string
  const convertDateInput = (
    dateInput: Date | string | number | number[] | undefined
  ): Date | string => {
    if (dateInput === undefined) {
      return new Date();
    }

    if (dateInput instanceof Date || typeof dateInput === "string") {
      return dateInput;
    }

    if (Array.isArray(dateInput)) {
      // Handle number[] case - convert array to a timestamp or ISO string
      // Using the first element if it's an array of timestamps
      return new Date(dateInput[0]);
    }

    // If it's a number, convert to Date
    return new Date(dateInput);
  };

  return {
    title: event.title || "",
    start: convertDateInput(event.start),
    end: convertDateInput(event.end),
    allDay: event.allDay || false,
    details: (event.extendedProps?.details as string) || "",
  };
};

export const useCalendar = () => {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar and events
  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Calendar>("/api/calendar");
      setCalendar(response.data);

      // Convert calendar events to EventInput format
      if (response.data.calendarEvents) {
        const formattedEvents =
          response.data.calendarEvents.map(convertToEventInput);
        setEvents(formattedEvents);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching calendar:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new event
  const addEvent = useCallback(
    async (event: EventInput): Promise<EventInput | null> => {
      try {
        const apiEvent = convertToApiFormat(event);
        const response = await axios.post<CalendarEvent>(
          "/api/calendar/events",
          apiEvent
        );
        const newEvent = convertToEventInput(response.data);

        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
      } catch (err) {
        console.error("Error adding event:", err);
        setError("Failed to add event");
        return null;
      }
    },
    []
  );

  // Update an existing event
  const updateEvent = useCallback(
    async (event: EventInput): Promise<EventInput | null> => {
      if (!event.id) {
        setError("Event ID is required for updates");
        return null;
      }

      try {
        const apiEvent = convertToApiFormat(event);
        const response = await axios.patch<CalendarEvent>(
          `/api/calendar/events/${event.id}`,
          apiEvent
        );
        const updatedEvent = convertToEventInput(response.data);

        setEvents((prev) =>
          prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
        );

        return updatedEvent;
      } catch (err) {
        console.error("Error updating event:", err);
        setError("Failed to update event");
        return null;
      }
    },
    []
  );

  // Remove an event
  const removeEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      await axios.delete(`/api/calendar/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      return true;
    } catch (err) {
      console.error("Error removing event:", err);
      setError("Failed to remove event");
      return false;
    }
  }, []);

  // Load calendar data on initial render
  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return {
    calendar,
    events,
    loading,
    error,
    fetchCalendar,
    addEvent,
    updateEvent,
    removeEvent,
  };
};

export type { Calendar, CalendarEvent };
