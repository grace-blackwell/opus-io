# Calendar Components

This directory contains components related to the calendar functionality in the application.

## EventForm Component

The `EventForm` component provides a form dialog for creating and editing calendar events. It includes fields for:

- Title
- Start date/time
- End date/time
- All-day event toggle
- Details (new field)

The form also includes a Delete button when in edit mode, allowing users to easily remove events.

### Usage

```tsx
import { EventForm } from "@/components/calendar/event-form";
import { EventInput } from "@fullcalendar/core";

// In your component
const [showEventForm, setShowEventForm] = useState(false);
const [formMode, setFormMode] = useState<"create" | "edit">("create");
const [initialValues, setInitialValues] = useState({
  id: "",
  title: "",
  start: "",
  end: "",
  allDay: false,
  details: "",
});

const handleSubmit = async (eventData: EventInput) => {
  // Handle the event data
  console.log(eventData);

  // Save to database, etc.
};

const handleDelete = async (eventId: string) => {
  // Handle event deletion
  console.log(`Deleting event: ${eventId}`);

  // Delete from database, etc.
};

// Render the form
return (
  <>
    <button
      onClick={() => {
        setFormMode("create");
        setInitialValues({
          id: "",
          title: "",
          start: "",
          end: "",
          allDay: false,
          details: "",
        });
        setShowEventForm(true);
      }}
    >
      Create Event
    </button>

    <EventForm
      isOpen={showEventForm}
      onClose={() => setShowEventForm(false)}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initialValues={initialValues}
      mode={formMode}
    />
  </>
);
```

### Integration with FullCalendar

The EventForm is integrated with FullCalendar in the `FullCalendarComponent`. The form opens in different scenarios:

1. **Creating a new event**:

   - **Month View**: When clicking on a day in month view, the form opens with the selected date and default times (9:00 AM to 10:00 AM).
   - **Week View**: When clicking on a specific time slot in week view, the form opens with both the date and exact time pre-populated.

2. **Editing an existing event**:
   - When clicking on an existing event, the form opens in edit mode with all fields pre-populated.
   - The Delete button is available to remove the event.

## Features

1. **Form Validation**: Uses Zod schema validation to ensure all required fields are filled correctly.
2. **Responsive Design**: Works well on both desktop and mobile devices.
3. **Details Field**: Supports the new details field for adding additional information about events.
4. **Date/Time Formatting**: Automatically formats dates and times for input fields.
5. **Smart Auto-Population**:
   - In month view, clicking a day auto-populates the date with default business hours
   - In week view, clicking a time slot auto-populates both date and exact time
6. **Event Management**:
   - Create new events with all necessary details
   - Edit existing events by clicking on them in the calendar
   - Delete events with a confirmation prompt

## Implementation Notes

- The details field is stored in the `extendedProps` object of the FullCalendar EventInput.
- When displaying events, a preview of the details is shown if available.
- The form uses the UI components from the application's design system.
