'use client'

import React, {useEffect, useState} from 'react'
import {KanbanDetailsWithLanesCardsTasksTags, TaskAndTags, LaneDetail} from "@/lib/types";
import {Lane, Task} from "@prisma/client";
import {useModal} from "@/providers/modal-provider";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import CustomModal from "@/components/global/custom-modal";
import {CreateLaneForm} from "@/components/forms/create-lane";
import KanbanLane from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-lane";
import {PiKanbanLight} from "react-icons/pi";
import {DragDropContext, Droppable} from "@/lib/dnd-fix";
import {DropResult} from "@hello-pangea/dnd";

type Props = {
    lanes: LaneDetail[]
    kanbanId: string
    accountId: string
    kanbanDetails: KanbanDetailsWithLanesCardsTasksTags
    updateLanesOrder: (lanes: Lane[]) => Promise<void>
    updateTasksOrder: (tasks: Task[]) => Promise<void>
}

const KanbanView = ({lanes, kanbanId, accountId, kanbanDetails, updateLanesOrder, updateTasksOrder}: Props) => {
    const {setOpen} = useModal()
    const router = useRouter()
    const [allLanes, setAllLanes] = React.useState<LaneDetail[]>([])

    useEffect(() => {
        setAllLanes(lanes)
    }, [lanes])

    const tasksFromAllLanes: TaskAndTags[] = [];
    lanes.forEach((item) => {
        item.Tasks.forEach((i) => {
            tasksFromAllLanes.push(i);
        });
    });

    const [allTasks, setAllTasks] = useState(tasksFromAllLanes);

    const handleDragEnd = (results: DropResult) => {
        const { destination, source, type } = results;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        switch (type) {
            case "lane": {
                if (!allLanes) return;
                const newLanes = [...allLanes]
                    .toSpliced(source.index, 1)
                    .toSpliced(destination.index, 0, allLanes[source.index])
                    .map((lane, index) => {
                        return {
                            ...lane,
                            order: index,
                        };
                    });

                setAllLanes(newLanes);
                updateLanesOrder(newLanes);
                break;
            }

            case "task": {
                if (!allLanes) return;
                let newLanes = [...allLanes];
                const originLane = newLanes.find((lane) => lane.id === source.droppableId);

                const destinationLane = newLanes.find((lane) => lane.id === destination.droppableId);

                if (!originLane || !destinationLane) {
                    return;
                }

                if (source.droppableId === destination.droppableId) {
                    const newOrderedTasks = [...originLane.Tasks]
                        .toSpliced(source.index, 1)
                        .toSpliced(destination.index, 0, originLane.Tasks[source.index])
                        .map((item, idx) => {
                            return { ...item, order: idx };
                        });
                    originLane.Tasks = newOrderedTasks;
                    setAllLanes(newLanes);
                    updateTasksOrder(newOrderedTasks);
                    router.refresh();
                } else {
                    const [currentTask] = originLane.Tasks.splice(source.index, 1);

                    originLane.Tasks.forEach((task, idx) => {
                        task.order = idx;
                    });

                    destinationLane.Tasks.splice(destination.index, 0, {
                        ...currentTask,
                        laneId: destination.droppableId,
                    });

                    destinationLane.Tasks.forEach((task, idx) => {
                        task.order = idx;
                    });
                    setAllLanes(newLanes);
                    updateTasksOrder([...destinationLane.Tasks, ...originLane.Tasks]);
                    router.refresh();
                }
                break;
            }
        }
    };

    const handleAddLane = () => {
        setOpen(<CustomModal title={'Create a Lane'} subheading={'Lanes allow you to group tasks together by type or priority.'}>
            <CreateLaneForm kanbanId={kanbanId} />
        </CustomModal>)
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
                <div className={'rounded-xl p-4 use-automation-zoom-in'}>
                    <div className={'flex items-center justify-between'}>
                        <h1 className={'text-xl'}>{kanbanDetails?.name}</h1>
                        <Button
                            className={'flex items-center gap-4'}
                            onClick={handleAddLane}
                        >
                            <Plus size={15}/>
                            Create Lane
                        </Button>
                    </div>
                    <Droppable
                        droppableId={'lanes'}
                        type={'lane'}
                        direction={'horizontal'}
                        key={'lanes'}
                    >
                        {(provided) => (
                            <div
                                className={'flex item-center gap-x-2 overflow-visible'}
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                <div className={'flex mt-4'}>
                                    {allLanes.map((lane, index) => (
                                            <KanbanLane
                                                key={lane.id}
                                                setAllTasks={setAllTasks}
                                                allTasks={allTasks}
                                                tasks={lane.Tasks}
                                                kanbanId={kanbanId}
                                                laneDetail={lane}
                                                accountId={accountId}
                                                index={index}
                                            />
                                        )
                                    )}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                    {allLanes.length == 0 && (
                        <div className={'flex items-center justify-center w-full flex-col'}>
                            <div className={'opacity-100'}>
                                <PiKanbanLight size={200} className={'text-muted-foreground'}/>
                            </div>
                        </div>
                    )}
                </div>
        </DragDropContext>
    )
}

export default KanbanView