"use client";

import React, {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import { useCalendar } from "@/hooks/use-calendar";
import { EventForm } from "@/components/calendar/event-form";
import "./full-calendar.css";

// Define types for our component props
interface FullCalendarComponentProps {
  initialEvents?: EventInput[];
  onEventAdd?: (event: EventInput) => void;
  onEventChange?: (event: EventInput) => void;
  onEventRemove?: (eventId: string) => void;
  className?: string;
}

// Define the ref handle type
export interface FullCalendarHandle {
  addEvent: (event: EventInput) => void;
  getEvents: () => EventApi[];
}

const FullCalendarComponent = forwardRef<
  FullCalendarHandle,
  FullCalendarComponentProps
>(
  (
    {
      initialEvents = [],
      onEventAdd,
      onEventChange,
      onEventRemove,
      className = "",
    },
    ref
  ) => {
    // Reference to the calendar API
    const calendarRef = useRef<FullCalendar>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [showEventForm, setShowEventForm] = useState<boolean>(false);
    const [eventFormValues, setEventFormValues] = useState<{
      id?: string;
      title?: string;
      start?: string;
      end?: string;
      allDay?: boolean;
      details?: string;
    }>({});

    // Use our custom calendar hook
    const {
      events,
      loading,
      error,
      addEvent: addEventToDb,
      updateEvent: updateEventInDb,
      removeEvent: removeEventFromDb,
    } = useCalendar();

    // Initialize calendar with events from the database
    useEffect(() => {
      if (!loading && events.length > 0 && !isInitialized) {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          // Clear any existing events
          calendarApi.removeAllEvents();

          // Add events from the database
          events.forEach((event) => {
            calendarApi.addEvent(event);
          });

          setIsInitialized(true);
        }
      }
    }, [loading, events, isInitialized]);

    // Handle date selection - opens the event form
    const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); // Clear date selection

      // Format dates for the datetime-local input
      const formatDateForInput = (date: Date): string => {
        return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
      };

      // Determine if we're in month view or week view
      const isMonthView = selectInfo.view.type === "dayGridMonth";

      // For month view, we need to handle the time differently
      // In month view, the time is not specified, so we'll set default times
      const startDate = new Date(selectInfo.start);
      let endDate = new Date(selectInfo.end);

      if (isMonthView && !selectInfo.allDay) {
        // For month view, set default times (9:00 AM to 10:00 AM)
        startDate.setHours(9, 0, 0);

        // End date in month view is exclusive and set to 00:00 of the next day
        // We need to adjust it to be the same day with a later time
        endDate = new Date(startDate);
        endDate.setHours(10, 0, 0);
      }

      // Set initial values for the form
      setEventFormValues({
        start: formatDateForInput(startDate),
        end: formatDateForInput(endDate),
        allDay: selectInfo.allDay,
      });

      // Show the event form
      setShowEventForm(true);
    }, []);

    // Handle event form submission
    const handleEventFormSubmit = async (
      eventData: EventInput
    ): Promise<void> => {
      // Add to database first
      const savedEvent = await addEventToDb(eventData);

      if (savedEvent) {
        // Add to calendar UI
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.addEvent(savedEvent);
        }

        // Call the onEventAdd callback if provided
        if (onEventAdd) {
          onEventAdd(savedEvent);
        }
      }
    };

    // Handle event click - open the event form for editing
    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
      const event = clickInfo.event;
      const eventId = event.id;
      const eventTitle = event.title;
      const details = (event.extendedProps?.details as string) || "";

      // Format dates for the datetime-local input
      const formatDateForInput = (date: Date): string => {
        return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
      };

      // Set initial values for the form
      setEventFormValues({
        id: eventId,
        title: eventTitle,
        start: formatDateForInput(new Date(event.start || "")),
        end: formatDateForInput(new Date(event.end || event.start || "")),
        allDay: event.allDay,
        details: details,
      });

      // Show the event form in edit mode
      setShowEventForm(true);
    }, []);

    // Handle event deletion
    const handleEventDelete = useCallback(
      async (eventId: string) => {
        // Remove from database first
        const success = await removeEventFromDb(eventId);

        if (success) {
          // Remove from calendar UI
          const calendarApi = calendarRef.current?.getApi();
          const event = calendarApi?.getEventById(eventId);
          if (event) {
            event.remove();
          }

          // Call the onEventRemove callback if provided
          if (onEventRemove) {
            onEventRemove(eventId);
          }
        }
      },
      [onEventRemove, removeEventFromDb]
    );

    // Handle events change
    const handleEvents = useCallback(
      async (events: EventApi[]) => {
        // Call the onEventChange callback if provided
        if (onEventChange && events.length > 0) {
          const changedEvent = events[events.length - 1];
          const details = (changedEvent.extendedProps?.details as string) || "";

          const eventData: EventInput = {
            id: changedEvent.id,
            title: changedEvent.title,
            start: changedEvent.startStr,
            end: changedEvent.endStr,
            allDay: changedEvent.allDay,
            extendedProps: {
              details: details,
            },
          };

          // Update in database
          await updateEventInDb(eventData);

          // Call the callback
          onEventChange(eventData);
        }
      },
      [onEventChange, updateEventInDb]
    );

    // Custom event rendering to match theme
    const renderEventContent = (eventContent: EventContentArg) => {
      const details =
        (eventContent.event.extendedProps?.details as string) || "";
      const hasDetails = details.length > 0;

      return (
        <div className="flex flex-col overflow-auto items-center">
          <div className="text-xs font-semibold text-primary-content">
            {eventContent.timeText}
          </div>
          <div className="text-xs text-accent-content">
            {eventContent.event.title}
          </div>
          {hasDetails && (
            <div className="text-xs text-accent-content/70 truncate max-w-full">
              {details.length > 15 ? details.substring(0, 15) + "..." : details}
            </div>
          )}
        </div>
      );
    };

    // Define methods to expose via ref
    const addEvent = async (event: EventInput): Promise<void> => {
      // Make sure the event has extendedProps for details if not provided
      if (!event.extendedProps) {
        event.extendedProps = { details: "" };
      }

      // Add to database first
      const savedEvent = await addEventToDb(event);

      if (savedEvent) {
        // Add to calendar UI
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.addEvent(savedEvent);
        }
      }
    };

    // Method to get all events
    const getEvents = (): EventApi[] => {
      const calendarApi = calendarRef.current?.getApi();
      return calendarApi ? calendarApi.getEvents() : [];
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addEvent,
      getEvents,
    }));

    // Show loading state
    if (loading) {
      return (
        <div
          className={`calendar-container bg-base-100 p-4 w-full h-[50vh] ${className} flex items-center justify-center`}
        >
          <p>Loading calendar...</p>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div
          className={`calendar-container bg-base-100 p-4 w-full h-[50vh] ${className} flex items-center justify-center`}
        >
          <p className="text-error">Error loading calendar: {error}</p>
        </div>
      );
    }

    return (
      <div
        className={`calendar-container bg-base-100 p-4 w-full h-[50vh] ${className}`}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          initialEvents={initialEvents.length > 0 ? initialEvents : events}
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
          eventContent={renderEventContent}
          height="100%"
          eventClassNames="bg-primary text-primary-content border border-primary-content/10"
          dayHeaderFormat={{ weekday: "short" }}
          // Button styling
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
          }}
          bootstrapFontAwesome={false}
          buttonIcons={{
            prev: "chevron-left",
            next: "chevron-right",
            prevYear: "chevrons-left",
            nextYear: "chevrons-right",
          }}
          // Custom classes can be added via CSS in full-calendar.css
        />

        {/* Event Form Dialog */}
        <EventForm
          isOpen={showEventForm}
          onClose={() => setShowEventForm(false)}
          onSubmit={handleEventFormSubmit}
          onDelete={handleEventDelete}
          initialValues={eventFormValues}
          mode={eventFormValues.id ? "edit" : "create"}
        />
      </div>
    );
  }
);

FullCalendarComponent.displayName = "FullCalendarComponent";

export default FullCalendarComponent;
