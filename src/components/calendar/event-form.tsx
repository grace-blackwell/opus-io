"use client";

import React, { useEffect } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EventInput } from "@fullcalendar/core";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Define the form schema with Zod
const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  allDay: z.boolean().default(false),
  details: z.string().optional(),
});

// Ensure the schema type is properly defined
type EventFormSchema = z.infer<typeof eventFormSchema>;

// Define the form values type - use the schema type to ensure consistency
type EventFormValues = EventFormSchema;

// Define the component props
interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: EventInput) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  initialValues?: {
    id?: string;
    title?: string;
    start?: string;
    end?: string;
    allDay?: boolean;
    details?: string;
  };
  mode?: "create" | "edit";
}

export function EventForm({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialValues = {},
  mode = "create",
}: EventFormProps) {
  // Initialize the form with react-hook-form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as Resolver<EventFormValues>,
    defaultValues: {
      title: initialValues.title || "",
      start: initialValues.start || "",
      end: initialValues.end || "",
      allDay: initialValues.allDay ?? false,
      details: initialValues.details || "",
    },
  });

  // Update form values when initialValues change
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: initialValues.title || "",
        start: initialValues.start || "",
        end: initialValues.end || "",
        allDay: initialValues.allDay ?? false,
        details: initialValues.details || "",
      });
    }
  }, [form, initialValues, isOpen]);

  // Handle form submission
  const handleSubmit = async (values: EventFormValues) => {
    // Convert form values to EventInput format
    const eventData: EventInput = {
      id: initialValues.id, // Include the ID if we're editing an existing event
      title: values.title,
      start: values.start,
      end: values.end,
      allDay: values.allDay,
      extendedProps: {
        details: values.details,
      },
    };

    // Call the onSubmit callback
    await onSubmit(eventData);

    // Close the dialog
    onClose();
  };

  // Handle event deletion
  const handleDelete = async () => {
    if (!initialValues.id || !onDelete) return;

    // Confirm deletion
    if (
      window.confirm(
        `Are you sure you want to delete "${initialValues.title}"?`
      )
    ) {
      await onDelete(initialValues.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {initialValues.start
              ? `Event for ${new Date(
                  initialValues.start
                ).toLocaleDateString()}`
              : "Fill in the details for your new event"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>All day event</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add event details..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <div>
                {mode === "edit" && initialValues.id && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
