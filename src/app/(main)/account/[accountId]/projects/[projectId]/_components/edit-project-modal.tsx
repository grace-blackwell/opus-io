'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CustomModal from '@/components/global/custom-modal'
import ProjectDetails from '@/components/forms/project-details'

type Props = {
    accountId: string
    project: any
}

const EditProjectModal = ({ accountId, project }: Props) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const showModal = searchParams.get('modal') === 'edit-project'

    // Handle closing the modal
    const handleClose = () => {
        router.push(`/account/${accountId}/projects/${project.id}`)
    }

    if (!showModal) return null

    return (
        <CustomModal 
            title="Edit Project" 
            subheading="Update project details"
            onClose={handleClose}
        >
            <ProjectDetails 
                accountId={accountId} 
                project={project}
            />
        </CustomModal>
    )
}

export default EditProjectModal