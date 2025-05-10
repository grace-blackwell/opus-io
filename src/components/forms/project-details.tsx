"use client";

import React, { useEffect, useState } from "react";
import { Contact, $Enums } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createOrUpdateProject,
  saveActivityLogNotification,
} from "@/lib/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import Loading from "@/components/global/loading";
import { useModal } from "@/providers/modal-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectsWithAccountContactContracts } from "@/lib/types";
import { nanoid } from "nanoid";

const customInputStyles = {
  background: "var(--input)",
  border: "none",
  color: "var(--foreground)",
};

type Props = {
  accountId: string | null;
  contactId?: string | null;
  contractId?: string | null;
  projects?: ProjectsWithAccountContactContracts;
};

const FormSchema = z.object({
  projectTitle: z.string().min(1, { message: "Project title is required" }),
  description: z.string().optional(),
  projectId: z.string().optional(),
  contactId: z.string().optional(),
  estimatedHours: z.string().optional(),
  actualHours: z.string().optional(),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
  status: z.string().optional(),
});

const ProjectDetails: React.FC<Props> = ({
  accountId,
  contactId,
  projects,
}) => {
  const { setClose } = useModal();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      projectTitle: projects?.projectTitle ?? "",
      description: projects?.description ?? "",
      projectId: projects?.projectId ?? "",
      contactId: projects?.contactId ?? contactId ?? "no-client",
      estimatedHours: projects?.estimatedHours?.toString() ?? "",
      actualHours: projects?.actualHours?.toString() ?? "",
      estimatedCost: projects?.estimatedCost?.toString() ?? "",
      actualCost: projects?.actualCost?.toString() ?? "",
      status: projects?.status?.toString() ?? "NotStarted",
    },
  });

  // Fetch clients for the dropdown
  useEffect(() => {
    const fetchContacts = async () => {
      if (accountId) {
        try {
          const response = await fetch(`/api/contacts?accountId=${accountId}`);
          const data = await response.json();
          if (data.contacts) {
            setContacts(data.contacts);
          }
        } catch (error) {
          console.error("Error fetching clients:", error);
        }
      }
    };

    fetchContacts();
  }, [accountId]);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      if (!accountId) {
        toast.error("Account ID is required");
        return;
      }

      const projectData = {
        id: projects?.id ? projects.id : nanoid(),
        projectTitle: values.projectTitle,
        description: values.description,
        projectId: values.projectId,
        contactId:
          values.contactId === "no-client" ? null : values.contactId || null,
        estimatedHours: values.estimatedHours
          ? parseFloat(values.estimatedHours)
          : null,
        actualHours: values.actualHours ? parseFloat(values.actualHours) : null,
        estimatedCost: values.estimatedCost
          ? parseFloat(values.estimatedCost)
          : null,
        actualCost: values.actualCost ? parseFloat(values.actualCost) : null,
        status: values.status as $Enums.Status,
        createdAt: projects?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const response = await createOrUpdateProject(projectData, accountId);

      if (!response) throw new Error("Failed to create/update project");

      await saveActivityLogNotification(
        accountId,
        `${projects?.id ? "Updated" : "Created new"} project: ${
          values.projectTitle
        }`
      );

      toast.success(
        `Successfully ${projects?.id ? "updated" : "created"} project`,
        {
          description: `${values.projectTitle}`,
        }
      );

      setClose();
      router.refresh();
    } catch (e) {
      console.log(e);
      toast.error("Oops...", {
        description: "Something went wrong while saving the project.",
      });
    }
  }

  useEffect(() => {
    if (projects) {
      form.reset({
        projectTitle: projects.projectTitle,
        description: projects.description || "",
        projectId: projects.projectId || "",
        contactId: projects.contactId || contactId || "no-client",
        estimatedHours: projects.estimatedHours?.toString() || "",
        actualHours: projects.actualHours?.toString() || "",
        estimatedCost: projects.estimatedCost?.toString() || "",
        actualCost: projects.actualCost?.toString() || "",
        status: projects.status as $Enums.Status,
      });
    }
  }, [projects, contactId, form]);

  const isLoading = form.formState.isSubmitting;

  return (
    <Card className="w-full bg-muted">
      <CardHeader className="bg-muted">
        <CardTitle className="text-foreground">Project Information</CardTitle>
        <CardDescription className="text-muted-foreground">
          Please enter project details. Fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-foreground bg-muted">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formValues = form.getValues();
              console.log("Direct form values:", formValues);

              form.trigger().then((isValid) => {
                if (isValid) {
                  onSubmit(formValues);
                } else {
                  console.error("Form validation failed");
                  toast.error("Validation Error", {
                    description:
                      "Please check the form for errors and try again.",
                  });
                }
              });
            }}
            className="space-y-4 w-full text-foreground bg-muted"
          >
            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="projectTitle"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>* Project Title</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        placeholder="Project Title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Project ID</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        placeholder="Project ID or Reference Number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        placeholder="Project Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Client</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-client">No Client</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.contactName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Status</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NotStarted">Not Started</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <h3>Project Estimates</h3>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="Estimated Hours"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Estimated Cost</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="Estimated Cost"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <h3>Project Actuals</h3>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="actualHours"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Actual Hours</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="Actual Hours"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Actual Cost</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="Actual Cost"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="mt-4">
                {isLoading ? (
                  <Loading />
                ) : projects?.id ? (
                  "Update Project"
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProjectDetails;
