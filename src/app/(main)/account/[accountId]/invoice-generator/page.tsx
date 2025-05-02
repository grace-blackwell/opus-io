import React from 'react'
import { getAuthUserDetails } from "@/lib/queries";
import { db } from "@/lib/db";
import QuickbooksStyleGenerator from "./_components/quickbooks-style-generator";
import { addInvoiceGeneratorToSidebar } from "./add-sidebar-option";

type Props = {
    params: { accountId: string }
}

const InvoiceGeneratorPage = async ({ params }: Props) => {
    const parameters = await params;
    const user = await getAuthUserDetails();
    if (!user || !user.Account) return null;

    const accountDetails = await db.account.findUnique({
        where: {
            id: parameters.accountId
        }
    });

    if (!accountDetails) return null;

    // Add the invoice generator to the sidebar options if it doesn't exist
    await addInvoiceGeneratorToSidebar(parameters.accountId);

    // Get contacts for the account
    const contacts = await db.contact.findMany({
        where: {
            accountId: parameters.accountId
        },
        include: {
            BillingAddress: true
        }
    });

    return (
        <div className="flex flex-col">
            <QuickbooksStyleGenerator 
                accountId={parameters.accountId}
                accountDetails={accountDetails}
                contacts={contacts}
            />
        </div>
    );
}

export default InvoiceGeneratorPage