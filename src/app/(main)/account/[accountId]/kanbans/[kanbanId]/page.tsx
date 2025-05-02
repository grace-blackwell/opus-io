import React from 'react'
import {getKanbanDetails, getLanesWithTasksAndTags, updateLanesOrder, updateTasksOrder} from "@/lib/queries";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {LaneDetail} from "@/lib/types";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import KanbanInfobar from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-infobar";
import KanbanSettings from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-settings";
import KanbanView from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-view";

type Props = {
    params: {
        accountId: string
        kanbanId: string
    }
}

const KanbanIdPage = async ({params}: Props) => {
    const parameters = await params
    const kanbanDetails = await getKanbanDetails(parameters.kanbanId)

    if (!kanbanDetails) {
        return redirect(`/account/${parameters.accountId}/kanbans`);
    }

    const kanbans = await db.kanban.findMany({
        where: {
            accountId: parameters.accountId,
        }
    })

    const lanes = (await getLanesWithTasksAndTags(
        parameters.kanbanId
    )) as LaneDetail[];

    return (
        <Tabs defaultValue='view' className='w-full'>
            <TabsList className='bg-transparent h-16 w-full justify-between mb-4'>
                <KanbanInfobar
                    kanbanId={parameters.kanbanId}
                    accountId={parameters.accountId}
                    kanbans={kanbans} />
                <div>
                    <TabsTrigger value={'view'}>
                        Kanban View
                    </TabsTrigger>
                    <TabsTrigger value={'settings'}>
                        Settings
                    </TabsTrigger>
                </div>
            </TabsList>
            <TabsContent value={'view'}>
                <KanbanView
                    lanes={lanes}
                    kanbanDetails={kanbanDetails}
                    kanbanId={parameters.kanbanId}
                    accountId={parameters.accountId}
                    updateLanesOrder={updateLanesOrder}
                    updateTasksOrder={updateTasksOrder}
                />
            </TabsContent>
            <TabsContent value={'settings'}>
                <KanbanSettings
                    kanbanId={parameters.kanbanId}
                    kanbans={kanbans}
                    accountId={parameters.accountId}
                />
            </TabsContent>
        </Tabs>
    )
}

export default KanbanIdPage