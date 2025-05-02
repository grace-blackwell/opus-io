'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import CustomModal from '@/components/global/custom-modal'
import ProjectDetails from '@/components/forms/project-details'
import { Plus } from 'lucide-react'

type Props = {
    accountId: string
    className?: string
}

const AddProjectButton = ({ accountId, className }: Props) => {
    const { setOpen } = useModal()

    const handleCreateProject = () => {
        setOpen(
            <CustomModal title="Create New Project" subheading="Add a new project to your account">
                <ProjectDetails accountId={accountId} />
            </CustomModal>
        )
    }

    return (
        <Button onClick={handleCreateProject} className={className}>
            <Plus size={15} className="mr-2" />
            Add Project
        </Button>
    )
}

export default AddProjectButton