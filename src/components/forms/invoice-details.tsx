"use client";

import React, { useEffect, useState } from "react";
import { Contact, Project, Invoice } from "@prisma/client";
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
  createOrUpdateInvoice,
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
import { format, addDays } from "date-fns";
import { nanoid } from "nanoid";
import { InvoicesWithAccountContactContractProject } from "@/lib/types";

const customInputStyles = {
  background: "var(--input)",
  border: "none",
  color: "var(--foreground)",
};

type Props = {
  accountId: string | null;
  contactId?: string | null;
  projectId?: string | null;
  invoice?: Invoice | InvoicesWithAccountContactContractProject;
};

const FormSchema = z.object({
  invoiceDate: z.string(),
  dueDate: z.string(),
  paymentStatus: z.string(),
  currency: z.string(),
  unitType: z.string(),
  unitPrice: z.string().min(1, { message: "Unit price is required" }),
  quantity: z.string().min(1, { message: "Quantity is required" }),
  subtotal: z.string(),
  salesTaxRate: z.string().optional(),
  salesTaxAmount: z.string().optional(),
  totalDue: z.string(),
  taxId: z.string().optional(),
  contactId: z.string().min(1, { message: "Client is required" }),
  projectId: z.string().min(1, { message: "Project is required" }),
});

const InvoiceDetails: React.FC<Props> = ({
  accountId,
  contactId,
  projectId,
  invoice,
}) => {
  const { setClose, data } = useModal();
  // Use invoice from modal data if available
  const modalInvoice = data.invoice;
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    contactId || null
  );

  // Get today's date and due date (7 days from now) in YYYY-MM-DD format
  const today = format(new Date(), "yyyy-MM-dd");
  const dueDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      invoiceDate: invoice?.invoiceDate
        ? format(new Date(invoice.invoiceDate), "yyyy-MM-dd")
        : today,
      dueDate: invoice?.dueDate
        ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
        : dueDate,
      paymentStatus: invoice?.paymentStatus ?? "Unpaid",
      currency: invoice?.currency ?? "USD",
      unitType: invoice?.unitType ?? "Hourly",
      unitPrice: invoice?.unitPrice?.toString() ?? "",
      quantity: invoice?.quantity?.toString() ?? "",
      subtotal: invoice?.subtotal?.toString() ?? "",
      salesTaxRate: invoice?.salesTaxRate?.toString() ?? "",
      salesTaxAmount: invoice?.salesTaxAmount?.toString() ?? "",
      totalDue: invoice?.totalDue?.toString() ?? "",
      taxId: invoice?.taxId ?? "",
      contactId: invoice?.contactId ?? contactId ?? "",
      projectId: invoice?.projectId ?? projectId ?? "",
    },
  });

  // Fetch contacts for the dropdown
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
          console.error("Error fetching contacts:", error);
        }
      }
    };

    fetchContacts();
  }, [accountId]);

  // Fetch projects for the selected contact
  useEffect(() => {
    const fetchProjects = async () => {
      if (accountId && selectedContactId) {
        try {
          const response = await fetch(
            `/api/projects?accountId=${accountId}&contactId=${selectedContactId}`
          );
          const data = await response.json();
          if (data.projects) {
            setProjects(data.projects);
          }
        } catch (error) {
          console.error("Error fetching projects:", error);
        }
      }
    };

    if (selectedContactId) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [accountId, selectedContactId]);

  const watchUnitPrice = form.watch("unitPrice");
  const watchQuantity = form.watch("quantity");
  const watchSalesTaxRate = form.watch("salesTaxRate");

  // Calculate subtotal, sales tax amount, and total due when unit price or quantity changes
  useEffect(() => {
    const unitPrice = parseFloat(form.watch("unitPrice") || "0");
    const quantity = parseInt(form.watch("quantity") || "0");
    const salesTaxRate = parseFloat(form.watch("salesTaxRate") || "0");

    if (unitPrice && quantity) {
      const subtotal = unitPrice * quantity;
      form.setValue("subtotal", subtotal.toFixed(2));

      if (salesTaxRate) {
        const salesTaxAmount = subtotal * (salesTaxRate / 100);
        form.setValue("salesTaxAmount", salesTaxAmount.toFixed(2));
        form.setValue("totalDue", (subtotal + salesTaxAmount).toFixed(2));
      } else {
        form.setValue("salesTaxAmount", "0");
        form.setValue("totalDue", subtotal.toFixed(2));
      }
    }
  }, [watchUnitPrice, watchQuantity, watchSalesTaxRate, form]);

  // Handle contact selection change
  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    form.setValue("contactId", contactId);
    form.setValue("projectId", ""); // Reset project when contact changes
  };

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      if (!accountId) {
        toast.error("Account ID is required");
        return;
      }

      const invoiceData = {
        id: invoice?.id ? invoice.id : nanoid(),
        invoiceDate: new Date(values.invoiceDate),
        dueDate: new Date(values.dueDate),
        paymentStatus: values.paymentStatus,
        currency: values.currency,
        unitType: values.unitType,
        unitPrice: parseFloat(values.unitPrice),
        quantity: parseInt(values.quantity),
        subtotal: parseFloat(values.subtotal),
        salesTaxRate: values.salesTaxRate
          ? parseFloat(values.salesTaxRate)
          : undefined,
        salesTaxAmount: values.salesTaxAmount
          ? parseFloat(values.salesTaxAmount)
          : undefined,
        totalDue: parseFloat(values.totalDue),
        taxId: values.taxId,
        contactId: values.contactId,
        projectId: values.projectId,
      };

      const response = await createOrUpdateInvoice(invoiceData, accountId);

      if (!response) throw new Error("Failed to create/update invoice");

      await saveActivityLogNotification(
        accountId,
        `${
          invoice?.id ? "Updated" : "Created new"
        } invoice: #${response.invoiceNumber.toString()}`
      );

      toast.success(
        `Successfully ${invoice?.id ? "updated" : "created"} invoice`,
        {
          description: `Invoice #${response.invoiceNumber.toString()}`,
        }
      );

      setClose();
      router.refresh();
    } catch (e) {
      console.log(e);
      toast.error("Oops...", {
        description: "Something went wrong while saving the invoice.",
      });
    }
  }

  useEffect(() => {
    // Use either the directly passed invoice or the one from modal data
    const invoiceData = invoice || modalInvoice;

    if (invoiceData) {
      form.reset({
        invoiceDate: format(new Date(invoiceData.invoiceDate), "yyyy-MM-dd"),
        dueDate: format(new Date(invoiceData.dueDate), "yyyy-MM-dd"),
        paymentStatus: invoiceData.paymentStatus,
        currency: invoiceData.currency,
        unitType: invoiceData.unitType,
        unitPrice: invoiceData.unitPrice.toString(),
        quantity: invoiceData.quantity.toString(),
        subtotal: invoiceData.subtotal.toString(),
        salesTaxRate: invoiceData.salesTaxRate?.toString() || "",
        salesTaxAmount: invoiceData.salesTaxAmount?.toString() || "",
        totalDue: invoiceData.totalDue.toString(),
        taxId: invoiceData.taxId || "",
        contactId: invoiceData.contactId,
        projectId: invoiceData.projectId,
      });

      setSelectedContactId(invoiceData.contactId);
    }
  }, [invoice, modalInvoice, form]);

  const isLoading = form.formState.isSubmitting;

  return (
    <Card className="w-full bg-muted">
      <CardHeader className="bg-muted">
        <CardTitle className="text-foreground">Invoice Information</CardTitle>
        <CardDescription className="text-muted-foreground">
          Please enter invoice details. Fields marked with * are required.
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
                name="contactId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>* Client</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={(value) => handleContactChange(value)}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>* Project</FormLabel>
                    <Select
                      disabled={isLoading || !selectedContactId}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue
                            placeholder={
                              selectedContactId
                                ? "Select a project"
                                : "Select a client first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.projectTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input style={customInputStyles} type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input style={customInputStyles} type="date" {...field} />
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
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Currency</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={isLoading}
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit Type</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-none text-muted-foreground">
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Item">Item</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>* Unit Price</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>* Quantity</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="1"
                        placeholder="0"
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
                disabled={true}
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Subtotal</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="salesTaxRate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Sales Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={true}
                control={form.control}
                name="salesTaxAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Sales Tax Amount</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>

            <div className="flex md:flex-row gap-4">
              <FormField
                disabled={true}
                control={form.control}
                name="totalDue"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Total Due</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tax ID (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        style={customInputStyles}
                        placeholder="Tax ID"
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
                ) : invoice?.id ? (
                  "Update Invoice"
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetails;
