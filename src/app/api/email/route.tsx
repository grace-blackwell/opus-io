import { NextResponse, NextRequest } from 'next/server'
import { emailInvoiceToClient, sendEmail } from "@/lib/invoice-utils";
import { InvoicesWithAccountContactContractProject } from "@/lib/types";

// Handles POST requests to /api/email
export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        
        // If we have an invoice object, use the emailInvoiceToClient function
        if (body.invoice) {
            const invoice = body.invoice as InvoicesWithAccountContactContractProject;
            const result = await emailInvoiceToClient(invoice);
            
            if (result.success) {
                return Response.json({
                    success: true,
                    message: 'Email sent successfully',
                    accepted: result.result?.accepted
                });
            } else {
                return Response.json({
                    success: false,
                    message: result.message
                }, { status: 400 });
            }
        } 
        // Otherwise, use the generic sendEmail function
        else if (body.sender && body.recipients && body.subject && body.message) {
            const { sender, recipients, subject, message, attachments } = body;
            
            const result = await sendEmail({
                sender,
                recipients,
                subject,
                message,
                attachments
            });
            
            return Response.json({
                success: true,
                message: 'Email sent successfully',
                accepted: result.accepted
            });
        } 
        // If neither condition is met, return an error
        else {
            return Response.json({
                success: false,
                message: 'Invalid request body. Must include either invoice object or sender, recipients, subject, and message.'
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error sending email", error);
        return Response.json({
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }, { status: 500 });
    }
}