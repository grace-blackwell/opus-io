'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import { Edit } from 'lucide-react'
import ContactDetails from '@/components/forms/contact-details'
import { Contact } from '@prisma/client'

type Props = {
    user: any
    contactId: string
}

const EditContactButton = ({ user, contactId }: Props) => {
    const { setOpen } = useModal()
    const [isLoading, setIsLoading] = useState(false)

    const handleEditContact = async () => {
        setIsLoading(true)
        try {
            // Fetch the contact data
            const response = await fetch(`/api/contacts/${contactId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch contact')
            }
            
            const contact: Contact = await response.json()
            
            // Open the modal with the contact data
            setOpen(
                <ContactDetails 
                    accountData={user.Account} 
                    data={contact}
                />
            )
        } catch (error) {
            console.error('Error fetching contact:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button 
            size="sm"
            variant="outline"
            className="flex items-center gap-1 w-20"
            onClick={handleEditContact}
            disabled={isLoading}
        >
            <Edit className="h-4 w-4" />
            Edit
        </Button>
    )
}

export default EditContactButton