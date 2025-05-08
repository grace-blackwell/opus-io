'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import { Edit } from 'lucide-react'
import ContactDetails from '@/components/forms/contact-details'
import { BillingAddress, Contact, ContactTag } from '@prisma/client'
import CustomModal from "@/components/global/custom-modal"
import { toast } from 'sonner';

type ContactWithRelations = Contact & {
    BillingAddress?: BillingAddress | null;
    ContactTags?: ContactTag[];
    projects?: any[];
}

type Props = {
    user: any
    contactId: string
    size?: "default" | "sm" | "lg" | "icon"
}

const EditContactButton = ({ user, contactId, size = "sm" }: Props) => {
    const { setOpen } = useModal()
    const [isLoading, setIsLoading] = useState(false)

    const handleEditContact = async () => {
        setIsLoading(true)
        try {
            // Fetch the contact data
            const response = await fetch(`/api/contacts/${contactId}`)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Failed to fetch contact';
                console.error(`Error ${response.status}: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            
            const contact: ContactWithRelations = await response.json()
            
            console.log('Fetched contact data:', contact)
            
            // Open the modal with the contact data
            setOpen(<CustomModal title={'Edit Contact'} subheading={''}>
                <ContactDetails accountData={user.Account} data={contact}/>
            </CustomModal>)
        } catch (error) {
            console.error('Error fetching contact:', error);
            toast.error('Failed to load contact details', {
                description: 'Please try again or contact support if the issue persists.'
            });
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            size={size}
            variant={'ghost'}
            className="flex items-center gap-1 w-20 hover:bg-secondary cursor-pointer"
            onClick={handleEditContact}
            disabled={isLoading}
        >
            <Edit className="h-4 w-4" />
            Edit
        </Button>
    )
}

export default EditContactButton