'use client'

import React from 'react'
import { useModal } from "@/providers/modal-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
    title: string
    subheading: string
    children: React.ReactNode
    defaultOpen?: boolean
}

const CustomModal = ({title, subheading, children, defaultOpen = false}: Props) => {
    const { isOpen, setClose } = useModal()
    
    // Use the modal provider's state directly
    const isModalOpen = defaultOpen || isOpen
    
    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) setClose();
        }}>
            <DialogContent className='md:max-h-[700px] md:h-fit bg-muted'>
                <DialogHeader className='pt-8 text-left'>
                    <DialogTitle className='text-2xl font-bold'>{title}</DialogTitle>
                    <DialogDescription>{subheading}</DialogDescription>
                    {children}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default CustomModal