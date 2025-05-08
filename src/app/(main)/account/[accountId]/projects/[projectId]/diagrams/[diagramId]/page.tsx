import React from 'react'
import { getDiagram } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DiagramEditor from './_components/diagram-editor'
import DiagramEditorClient from './_components/diagram-editor-client'

type Props = {
    params: {
        accountId: string
        projectId: string
        diagramId: string
    }
}

const DiagramPage = async ({ params }: Props) => {
    const diagram = await getDiagram(params.diagramId)

    if (!diagram) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-bold">Diagram not found</h1>
                <p className="text-muted-foreground">The diagram you are looking for does not exist or you do not have access to it.</p>
                <Link href={`/account/${params.accountId}/projects/${params.projectId}?tab=diagrams`}>
                    <Button className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Project
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                <DiagramEditorClient 
                    diagram={diagram}
                    accountId={params.accountId}
                    projectId={params.projectId}
                />
            </div>
        </div>
    )
}

export default DiagramPage