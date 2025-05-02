import React from 'react'
import {db} from "@/lib/db";
import {redirect} from "next/navigation";

type Props = {
    params: {accountId: string}
}

const KanbanPage = async ({params}: Props) => {
    const parameters = await params
    const kanbanExists = await db.kanban.findFirst({
        where:{
            accountId: parameters.accountId,
        }
    })
    if(kanbanExists){
        return redirect(`/account/${parameters.accountId}/kanbans/${kanbanExists.id}`)
    }

    try {
        const response = await db.kanban.create({
            data:{
                name:"New Kanban",
                accountId: parameters.accountId
            }
        })
        return redirect(`/account/${parameters.accountId}/kanbans/${response.id}`)

    } catch (error) {
        console.log(error)
    }

    return (
        <div>
            Kanban Page
        </div>
    )
}

export default KanbanPage