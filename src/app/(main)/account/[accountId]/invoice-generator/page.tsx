import React from 'react'
import { getAuthUserDetails } from "@/lib/queries";
import { db } from "@/lib/db";
import InvoiceGenerator from "./_components/invoice-generator";
import { addInvoiceGeneratorToSidebar } from "./add-sidebar-option";

type Props = {
    params: { accountId: string }
}

const InvoiceGeneratorPage = async ({ params }: Props) => {
    const user = await getAuthUserDetails();
    if (!user || !user.Account) return null;

    const accountDetails = await db.account.findUnique({
        where: {
            id: params.accountId
        }
    });

    if (!accountDetails) return null;

    // Add the invoice generator to the sidebar options if it doesn't exist
    await addInvoiceGeneratorToSidebar(params.accountId);

    // Get contacts for the account
    const contacts = await db.contact.findMany({
        where: {
            accountId: params.accountId
        }
    });

    return (
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold mb-6">Invoice Generator</h1>
            <p className="text-muted-foreground mb-6">
                Create professional invoices quickly without needing to set up a project first.
            </p>
            <InvoiceGenerator 
                accountId={params.accountId} 
                accountDetails={accountDetails}
                contacts={contacts}
            />
        </div>
    );
}

export default InvoiceGeneratorPage