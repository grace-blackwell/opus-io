'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import { PlusCircle } from 'lucide-react'
import ContactDetails from '@/components/forms/contact-details'

type Props = {
    user: any
    className?: string
}

const CreateContactButton = ({ user, className }: Props) => {
    const { setOpen } = useModal()

    const handleCreateContact = () => {
        setOpen(
            <ContactDetails 
                accountData={user.Account} 
            />
        )
    }

    return (
        <Button 
            className={className} 
            onClick={handleCreateContact}
        >
            <PlusCircle className='h-4 w-4 mr-2' />
            Create Contact
        </Button>
    )
}

export default CreateContactButton