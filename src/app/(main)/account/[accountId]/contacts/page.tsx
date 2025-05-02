import React from 'react'
import { getAuthUserDetails } from "@/lib/queries";
import { db } from "@/lib/db";
import CreateContactButton from "./_components/create-contact-button";
import ContactsView from './_components/contacts-view';

type Props = {
    params: {accountId: string};
}

const AllContactsPage = async ({params}: Props) => {
    const parameters = await params;
    const user = await getAuthUserDetails()
    if (!user || !user.Account) return null;

    const contacts = await db.contact.findMany({
        where: {
            accountId: parameters.accountId
        },
        include: {
            ContactTags: true,
            BillingAddress: true
        },
        orderBy: {
            contactName: 'asc'
        }
    });

    return (
        <div className='flex flex-col'>
            <div className="flex justify-between items-center mb-6">
                <CreateContactButton user={user} className='w-[200px]'/>
            </div>
            <ContactsView 
                contacts={contacts} 
                accountId={parameters.accountId} 
                user={user} 
            />
        </div>
    )
}

export default AllContactsPage
