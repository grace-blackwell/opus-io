"use client";
import CustomModal from "@/components/global/custom-modal";
import InvoiceDetails from "@/components/forms/invoice-details";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {toast} from "sonner"
import {deleteInvoice, getInvoice} from "@/lib/queries";
import { generateInvoicePDF, emailInvoiceToContact } from "@/lib/invoice-utils";
import { InvoicesWithAccountContactContractProject } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { ColumnDef } from "@tanstack/react-table";
import {Edit, MoreHorizontal, FileText, Mail, MailOpen} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {Badge} from "@/components/ui/badge";
import ReactPDF, {PDFDownloadLink} from "@react-pdf/renderer";
import InvoicePdf from "@/app/(main)/account/[accountId]/invoices/_components/invoice-pdf";

export const columns: ColumnDef<InvoicesWithAccountContactContractProject>[] = [
    {
        accessorKey: "id",
        header: "",
        cell: () => {
            return null;
        },
    },
    {
        accessorKey: "invoiceNumber",
        header: "INVOICE #",
        cell: ({ row }) => {
            const invoiceNumber = row.getValue("invoiceNumber") as string;
            return (
                <div className="flex items-center gap-4 font-medium text-primary">
                    {invoiceNumber}
                </div>
            );
        },
    },
    {
        accessorKey: "projectTitle",
        header: "PROJECT",
        cell: ({ row }) => {
            const projectTitle = row.original?.Project?.projectTitle;
            return (
                <div className="flex items-center gap-4">
                    {projectTitle}
                </div>
            );
        },
    },
    {
        accessorKey: "Contact",
        header: "CONTACT",
        cell: ({ row }) => {
            const ContactName = row.original?.Contact?.contactName;
            return (
                <div className="flex items-center gap-4">
                    {ContactName}
                </div>
            );
        },
    },
    {
        accessorKey: "totalDue",
        header: "TOTAL DUE",
        cell: ({ row }) => {
            const totalDue = row.getValue("totalDue") as number;
            const currency = row.original?.currency || 'USD';
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(totalDue);
            return (
                <div className="flex items-center gap-4">
                    <span className='badge badge-soft badge-success badge-md'>{formatted}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "STATUS",
        cell: ({ row }) => {
            const paymentStatus = row.getValue("paymentStatus") as string;
            return (
                <div className="flex items-center gap-4">
                    {paymentStatus}
                </div>
            );
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const rowData = row.original;

            return <CellActions rowData={rowData} />;
        },
    },
];

interface CellActionsProps {
    rowData: InvoicesWithAccountContactContractProject;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
    const { data, setOpen } = useModal();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    if (!rowData) return;
    if (!rowData.Account) return;
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        className="flex gap-2"
                        onClick={() => {
                            setOpen(
                                <CustomModal subheading="Enter the invoice details" title="Invoice Details">
                                    <InvoiceDetails
                                        accountId={rowData?.Account?.id || null}
                                        projectId={rowData.Project?.id || null}
                                        invoice = {rowData}/>
                                </CustomModal>,
                                async () => {
                                    return { user: await getInvoice(rowData?.id) };
                                }
                            );
                        }}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Invoice Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <PDFDownloadLink document={<InvoicePdf invoice={rowData}/>}>
                            <span className='flex gap-2'>
                                <FileText className="h-4 w-4 mr-2" />
                                Export to PDF
                            </span>
                        </PDFDownloadLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex gap-2"
                        onClick={() => {
                            if (!rowData.Contact?.contactEmail) {
                                toast.error('Cannot Send Email', {
                                    description: 'Contact email address not found. Please add an email address to the contact.'
                                });
                                return;
                            }
                            
                            // Format currency for the email body
                            const formattedAmount = new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: rowData.currency || 'USD'
                            }).format(rowData.totalDue);
                            
                            // Format dates for the email body
                            const invoiceDate = new Date(rowData.invoiceDate).toLocaleDateString();
                            const dueDate = new Date(rowData.dueDate).toLocaleDateString();
                            
                            // Create email subject
                            const subject = `Invoice #${rowData.invoiceNumber} from ${rowData.Account?.accountName || "Opus"}`;
                            
                            // Create email body
                            const body = `
Dear ${rowData.Contact.contactName},

Please find attached the invoice #${rowData.invoiceNumber} for ${rowData.Project?.projectTitle || 'our services'}.

Invoice Details:
- Invoice Number: ${rowData.invoiceNumber}
- Date: ${invoiceDate}
- Due Date: ${dueDate}
- Amount Due: ${formattedAmount}

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
${rowData.Account?.accountName || "Opus"}
                            `;
                            
                            // Create mailto URL
                            const mailtoUrl = `mailto:${rowData.Contact.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            
                            // Open the user's native email client
                            window.open(mailtoUrl, '_blank');
                            
                            toast.success('Email Client Opened', {
                                description: `Compose an email to ${rowData.Contact.contactEmail}`
                            });
                        }}
                    >
                        <MailOpen className="h-4 w-4 mr-2" />
                        Open in Email Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex gap-2"
                        onClick={async () => {
                            if (!rowData.Contact?.contactEmail) {
                                toast.error('Email Not Sent', {
                                    description: 'Contact email address not found. Please add an email address to the contact.'
                                });
                                return;
                            }
                            
                            toast.info('Sending Email...', {
                                description: `Sending invoice #${rowData.invoiceNumber.toString()} to ${rowData.Contact.contactEmail}.`
                            });
                            
                            try {
                                // Use the server action to send the email
                                const result = await emailInvoiceToContact(rowData);
                                
                                if (result.success) {
                                    toast.success('Email Sent', {
                                        description: `Invoice #${rowData.invoiceNumber.toString()} has been sent to ${rowData.Contact.contactEmail}.`
                                    });
                                } else {
                                    toast.error('Email Not Sent', {
                                        description: result.message
                                    });
                                }
                            } catch (error) {
                                console.error('Error sending email:', error);
                                toast.error('Email Not Sent', {
                                    description: 'An unexpected error occurred while sending the email.'
                                });
                            }
                        }}
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Directly
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-left">Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-left">This action cannot be undone. This will permanently delete the invoice and related data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex items-center">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        className="bg-destructive hover:bg-destructive"
                        onClick={async () => {
                            setLoading(true);
                            await deleteInvoice(rowData.id);
                            toast.success(
                                'Project deleted successfully',
                                {description: `Invoice "${rowData.invoiceNumber}" has been deleted.`})
                            setLoading(false);
                            router.refresh();
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}