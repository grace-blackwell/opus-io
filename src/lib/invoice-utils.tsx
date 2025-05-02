'use server'

import nodemailer from 'nodemailer';
import { InvoicesWithAccountContactContractProject } from "./types";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Mail from "nodemailer/lib/mailer";
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePdf from '@/app/(main)/account/[accountId]/invoices/_components/invoice-pdf';

const transport = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST,
    port: process.env.SMTP_SERVER_PORT,
    secure: process.env.NODE_ENV !== 'development', // true
    auth: {
        user: process.env.SMTP_SERVER_USERNAME,
        pass: process.env.SMTP_SERVER_PASSWORD,
    }
} as SMTPTransport.Options)

type EmailProps = {
    sender: Mail.Address,
    recipients: Mail.Address[],
    subject: string,
    message: string,
    attachments?: Mail.Attachment[]
}

// Function to send email with custom parameters
export async function sendEmail({sender, recipients, subject, message, attachments}: EmailProps) {
    return await transport.sendMail({
        from: sender,
        to: recipients,
        subject,
        html: message,
        text: message,
        attachments
    });
}

// Function to generate invoice PDF
export async function generateInvoicePDF(invoice: InvoicesWithAccountContactContractProject): Promise<Buffer> {
    try {
        // Generate PDF buffer
        return await renderToBuffer(<InvoicePdf invoice={invoice} />);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate invoice PDF');
    }
}

// Function to email invoice to client
export async function emailInvoiceToContact(invoice: InvoicesWithAccountContactContractProject) {
    try {
        if (!invoice?.Contact?.contactEmail) {
            return {
                success: false,
                message: 'Client email address not found'
            };
        }

        // Generate PDF buffer
        const pdfBuffer = await generateInvoicePDF(invoice);
        
        const sender = {
            name: invoice.Account?.accountName || "Opus",
            address: invoice.Account?.accountEmail || "no-reply@opus.io"
        };

        const recipients = [{
            name: invoice.Contact.contactName || "Client",
            address: invoice.Contact.contactEmail
        }];

        const subject = `Invoice #${invoice.invoiceNumber} from ${invoice.Account?.accountName || "Opus"}`;
        
        const message = `
            <html>
                <body>
                    <h2>Invoice #${invoice.invoiceNumber}</h2>
                    <p>Dear ${invoice.Contact.contactName},</p>
                    <p>Please find attached the invoice #${invoice.invoiceNumber} for ${invoice.Project?.projectTitle || 'our services'}.</p>
                    <p>Invoice Details:</p>
                    <ul>
                        <li>Invoice Number: ${invoice.invoiceNumber}</li>
                        <li>Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</li>
                        <li>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                        <li>Amount Due: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currency || 'USD'
                        }).format(invoice.totalDue)}</li>
                    </ul>
                    <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
                    <p>Thank you for your business!</p>
                    <p>Best regards,<br>${invoice.Account?.accountName || "Opus"}</p>
                </body>
            </html>
        `;

        const result = await sendEmail({
            sender,
            recipients,
            subject,
            message,
            attachments: [
                {
                    filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        return {
            success: true,
            message: 'Email sent successfully',
            result
        };
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}