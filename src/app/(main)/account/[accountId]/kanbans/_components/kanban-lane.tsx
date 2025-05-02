'use client'

import {Dispatch, FC, SetStateAction, useMemo} from "react";
import {LaneDetail, TaskWithTags} from "@/lib/types";
import {useRouter} from "next/navigation";
import {useModal} from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import CreateLaneForm from "@/components/forms/create-lane";
import {deleteLane, saveActivityLogNotification} from "@/lib/queries";
import {toast} from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {Edit, MoreVertical, PlusCircleIcon, Trash} from "lucide-react";
import KanbanTask from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-task";
import TaskForm from "@/components/forms/task-form";
import {Draggable, Droppable} from "@/lib/dnd-fix";


interface KanbanLaneProps {
  setAllTasks: Dispatch<SetStateAction<TaskWithTags>>;
  allTasks: TaskWithTags;
  tasks: TaskWithTags;
  kanbanId: string;
  laneDetail: LaneDetail;
  accountId: string;
  index: number;
  projectId?: string;
}

const KanbanLane: FC<KanbanLaneProps> = ({setAllTasks, allTasks, tasks, kanbanId, laneDetail, accountId, index, projectId}: KanbanLaneProps) => {
    const { setOpen } = useModal();
    const router = useRouter();

    const amt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
    });

    const laneAmt = useMemo(() => {
        return tasks.reduce(
            (sum, task) => sum + (Number(task?.value)), 0);
    }, [tasks]);

    const randomColor = `#${Math.random().toString(16).slice(2, 8)}`;

    const handleEditLane = () => {
        setOpen(
            <CustomModal title="Edit Lane Details" subheading="">
                <CreateLaneForm kanbanId={kanbanId} defaultData={laneDetail} />
            </CustomModal>
        );
    };

    const handleDeleteLane = async () => {
        try {
            const response = await deleteLane(laneDetail.id);
            await saveActivityLogNotification(accountId, `Deleted lane ${laneDetail.name}`);

            toast('Successfully deleted lane');

            router.refresh();
        } catch (err) {
            console.log(err);
            toast('Oops...',{description: 'Something went wrong while deleting the lane.'});
        }
    };

    const addNewTask = (task: TaskWithTags[0]) => {
        setAllTasks([...allTasks, task]);
    };

    const handleCreateTask = () => {
        setOpen(
            <CustomModal title={projectId ? "Create A Project Task" : "Create A Task"} subheading="Tasks items are a great way to keep track of necessary project work.">
                <TaskForm 
                    getNewTask={addNewTask} 
                    laneId={laneDetail.id} 
                    accountId={accountId} 
                    defaultProjectId={projectId}
                />
            </CustomModal>
        );
    };

    return (
        <Draggable draggableId={laneDetail.id.toString()} index={index} key={laneDetail.id}>
            {(provided, snapshot) => {
                if (snapshot.isDragging) {
                    //@ts-ignore
                    const offset = { x: 300, y: 0 };
                    //@ts-ignore
                    const x = provided.draggableProps.style?.left - offset.x;
                    //@ts-ignore
                    const y = provided.draggableProps.style?.top - offset.y;
                    //@ts-ignore
                    provided.draggableProps.style = {
                        ...provided.draggableProps.style,
                        top: y,
                        left: x,
                    };
                }
                return (
                    <div {...provided.draggableProps} ref={provided.innerRef} className="h-full p-2">
                        <AlertDialog>
                            <DropdownMenu>
                                <div
                                    className="bg-muted h-full w-[300px] px-2 relative overflow-visible rounded-md flex-shrink-0 "
                                >
                                    <div
                                        {...provided.dragHandleProps}
                                        className=" h-14 backdrop-blur-lg absolute top-0 left-0 right-0 z-10 "
                                    >
                                        <div
                                            className="h-full flex bg-muted items-center p-2 justify-between cursor-grab"
                                        >
                                             {/*{laneDetail.order}*/}
                                            <div className="flex items-center w-full gap-2">
                                                <span className="font-bold text-sm">{laneDetail.name}</span>
                                            </div>
                                            <div className="flex items-center flex-row">
                                                <Badge className="bg-white text-black">{amt.format(laneAmt)}</Badge>
                                                <DropdownMenuTrigger>
                                                    <MoreVertical className="text-muted-foreground cursor-pointer" />
                                                </DropdownMenuTrigger>
                                            </div>
                                        </div>
                                    </div>

                                    <Droppable
                                        droppableId={laneDetail.id.toString()}
                                        key={laneDetail.id}
                                        type="task"
                                    >
                                        {(provided) => (
                                            <div className="h-full overflow-y-auto no-scrollbar pt-12 bg-card">
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className="mt-2 h-full"
                                                >
                                                    {tasks.map((task, index) => (
                                                        <KanbanTask allTasks={allTasks} setAllTasks={setAllTasks} accountId={accountId} task={task} key={task.id.toString()} index={index} />
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>

                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger>
                                            <DropdownMenuItem className="flex items-center gap-2">
                                                <Trash size={15} />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>

                                        <DropdownMenuItem className="flex items-center gap-2" onClick={handleEditLane}>
                                            <Edit size={15} />
                                            Edit
                                        </DropdownMenuItem>
                                        {projectId ? (
                                            <DropdownMenuItem className="flex items-center gap-2" onClick={handleCreateTask}>
                                                <PlusCircleIcon size={15} />
                                                Create Project Task
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem className="flex items-center gap-2" onClick={handleCreateTask}>
                                                <PlusCircleIcon size={15} />
                                                Create Task
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </div>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex items-center">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive" onClick={handleDeleteLane}>
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </DropdownMenu>
                        </AlertDialog>
                    </div>
                );
            }}
        </Draggable>
    );

}

export default KanbanLane;