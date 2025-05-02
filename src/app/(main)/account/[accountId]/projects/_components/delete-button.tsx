'use client'

import React from 'react'
import { deleteProject, saveActivityLogNotification } from '@/lib/queries'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
    projectId: string
    projectTitle?: string
}

const DeleteButton = ({ projectId, projectTitle }: Props) => {
    const router = useRouter()
    
    const handleDeleteProject = async () => {
        try {
            const response = await deleteProject(projectId)
            await saveActivityLogNotification(
                response?.accountId as string,
                `Deleted Project: ${projectTitle || 'Untitled'}`
            )
            toast.success('Project deleted successfully', {
                description: `Project "${projectTitle || 'Untitled'}" has been deleted.`
            })
            router.refresh()
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.error('Failed to delete project', {
                description: 'An error occurred while deleting the project.'
            })
        }
    }

    return (
        <div onClick={handleDeleteProject} className="flex items-center justify-center w-full">
            Delete
        </div>
    )
}

export default DeleteButton