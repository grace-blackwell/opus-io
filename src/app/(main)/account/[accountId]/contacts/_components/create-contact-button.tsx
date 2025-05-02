'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import { PlusCircle } from 'lucide-react'
import ContactDetails from '@/components/forms/contact-details'
import CustomModal from "@/components/global/custom-modal";

type Props = {
    user: any
    className?: string
}

const CreateContactButton = ({ user, className }: Props) => {
    const { setOpen } = useModal()

    const handleCreateContact = () => {
        setOpen(<CustomModal title={'Add New Contact'} subheading={'Contacts can be grouped by type'}>
            <ContactDetails accountData={user.Account}/>
        </CustomModal>)
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