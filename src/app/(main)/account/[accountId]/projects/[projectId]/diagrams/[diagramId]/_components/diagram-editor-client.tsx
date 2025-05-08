'use client'

import React, { useState } from 'react'
import { Diagram } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
    diagram: Diagram
    accountId: string
    projectId: string
}

const DiagramEditorClient = ({ diagram, accountId, projectId }: Props) => {
    const router = useRouter()
    
    // Function to go back to the project page
    const handleBack = () => {
        router.push(`/account/${accountId}/projects/${projectId}?tab=diagrams`)
    }
    
    // Function to open the diagram in draw.io in a new tab
    const handleOpenInDrawIo = () => {
        // Create a URL to open the diagram in draw.io
        const callbackUrl = `${window.location.origin}/api/diagrams/${diagram.id}`
        const url = `https://app.diagrams.net/?url=${encodeURIComponent(callbackUrl)}&saveAndExit=1`
        
        // Open draw.io in a new tab
        window.open(url, '_blank')
        
        toast.info('Opening draw.io in a new tab. Your changes will be saved when you click "Save" in the editor.')
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Project
                </Button>
                <h1 className="text-xl font-bold">{diagram.name}</h1>
                <Button onClick={handleOpenInDrawIo}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Edit in draw.io
                </Button>
            </div>
            <div className="flex-grow p-6">
                <Card className="w-full h-full">
                    <CardHeader>
                        <CardTitle>Diagram Editor</CardTitle>
                        <CardDescription>
                            Click the "Edit in draw.io" button to open the diagram in the draw.io editor.
                            Your changes will be saved when you click "Save" in the editor.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[500px]">
                        <div className="text-center space-y-4">
                            <p className="text-lg font-medium">
                                We're having trouble embedding the draw.io editor directly.
                            </p>
                            <p className="text-sm text-muted-foreground max-w-md">
                                As a temporary solution, you can edit your diagram by opening it in a new tab.
                                After editing, click "Save" in the editor to save your changes.
                            </p>
                            <Button onClick={handleOpenInDrawIo} size="lg">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in draw.io
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default DiagramEditorClient