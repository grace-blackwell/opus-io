'use client'

import React from "react"
import {Kanban} from "@prisma/client";
import {useRouter} from "next/navigation";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {deleteKanban, saveActivityLogNotification} from "@/lib/queries";
import {toast} from "sonner";
import CreateKanbanForm from "@/components/forms/create-kanban";

const KanbanSettings = (
    {kanbanId, accountId, kanbans }
        :
        {kanbanId: string, accountId: string, kanbans: Kanban[]}
) => {
    const router = useRouter()

    return (
        <AlertDialog>
            <div>
                <div className={'flex items-center justify-between mb-4'}>
                    <AlertDialogTrigger asChild>
                        <Button variant={'destructive'}>
                            Delete Kanban
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your kanban board and all associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className={'items-center'}>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    try {
                                        await deleteKanban(kanbanId)
                                        await saveActivityLogNotification(accountId, `Deleted Kanban Board - ${kanbans.find((k) => k.id === kanbanId)?.name}`)
                                        toast.success('Kanban deleted successfully')
                                        router.replace(`/account/${accountId}/kanbans`)
                                    } catch (error) {
                                        console.log(error)
                                        toast.error('Oops...', {description: 'Something went wrong while deleting the kanban'})
                                    }
                                }}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </div>

                <CreateKanbanForm
                    accountId={accountId}
                    defaultData={kanbans.find((k) => k.id === kanbanId)}
                />
            </div>
        </AlertDialog>
    )
}

export default KanbanSettings