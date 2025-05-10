'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { deleteContact } from '@/lib/queries'
import { toast } from 'sonner'

type Props = {
    contactId: string
}

const DeleteButton = ({ contactId }: Props) => {
    const router = useRouter()

    const handleDeleteContact = async () => {
        try {
            const response = await deleteContact(contactId)
            if (!response) throw new Error('Failed to delete contact')

            toast.success('Contact deleted successfully')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete contact')
        }
    }

    return (
        <div onClick={handleDeleteContact}>
            Delete
        </div>
    )
}

export default DeleteButton