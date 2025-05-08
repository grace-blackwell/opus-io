import {Dispatch, SetStateAction} from "react";
import {useRouter} from "next/navigation";
import {useModal} from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import {toast} from "sonner";
import {deleteTask, saveActivityLogNotification} from "@/lib/queries";
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
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Briefcase, Contact2, Edit, LinkIcon, MoreHorizontalIcon, Trash, User2} from "lucide-react";
import {Draggable} from "@/lib/dnd-fix";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {TaskWithTags} from "@/lib/types";
import TaskForm from "@/components/forms/task-form";
import TagComponent from "@/components/global/tag";
import TaskTimeTracker from "@/components/time-tracker/task-time-tracker";


type Props = {
    setAllTasks: Dispatch<SetStateAction<TaskWithTags>>;
    task: TaskWithTags[0];
    allTasks: TaskWithTags;
    accountId: string;
    index: number;
};

const KanbanTask = ({setAllTasks, task, allTasks, accountId, index}: Props) => {
    const router = useRouter();
    const { setOpen } = useModal();

    const editNewTask = (task: TaskWithTags[0]) => {
        setAllTasks((tasks) => allTasks.map(
            (t) => (t.id === task.id ? task : t)));
    };

    const handleClickEdit = () => {
        setOpen(
            <CustomModal title="Update Task Details" subheading="">
                <TaskForm getNewTask={editNewTask} laneId={task.laneId} accountId={accountId} />
            </CustomModal>,
            async () => {
                return { task: task };
            }
        );
    };

    const handleDeleteTask = async () => {
        try {
            setAllTasks((tasks) => tasks.filter((t) => t.id !== task.id));
            const response = await deleteTask(task.id);
            toast('Deleted task from lane.');
            await saveActivityLogNotification(accountId, `Deleted task ${task.name}.`);

            router.refresh();
        } catch (error) {
            toast('Oops...',{description: 'Something went wrong while deleting the task.'});
            console.log(error);
        }
    };

    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided, snapshot) => {
                if (snapshot.isDragging) {
                    const offset = { x: 300, y: 20 };
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
                    <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                        <AlertDialog>
                            <DropdownMenu>
                                <Card className="my-4 bg-base-100 border-none shadow-md rounded-none">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="text-sm text-base-content">{task.name}</span>
                                            <DropdownMenuTrigger className={'cursor-pointer'}>
                                                <MoreHorizontalIcon className="text-base-content" />
                                            </DropdownMenuTrigger>
                                        </CardTitle>
                                        <span className="text-base-content text-xs">{new Date().toLocaleDateString()}</span>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {task.Tags.map((tag) => (
                                                <TagComponent key={tag.id} title={tag.name} colorName={tag.color} />
                                            ))}
                                        </div>
                                        <CardDescription className={'text-xs text-base-content'}>{task.description}</CardDescription>
                                        <div className={'flex gap-2 py-2 items-center'}>
                                            <Briefcase size={15} className={'text-primary'} />
                                            <div className={'flex flex-col justify-center'}>
                                                    <span className="text-sm font-bold text-base-content">{task.Project?.projectTitle}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <div className="px-4 py-2 border-t border-base-content">
                                        <TaskTimeTracker 
                                            task={task} 
                                            onTimeUpdate={(updatedTask) => {
                                                editNewTask(updatedTask);
                                            }} 
                                        />
                                    </div>
                                    <CardFooter className="p-2 border-t-1 border-base-content flex items-center justify-between">
                                        <span className="text-sm font-bold text-base-content">
                                            {!!task.value &&
                                                new Intl.NumberFormat(undefined, {
                                                    style: "currency",
                                                    currency: "USD",
                                                }).format(+task.value)}
                                        </span>
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className="p-2 text-primary flex gap-2 hover:bg-muted transition-all rounded-lg cursor-pointer items-center">
                                                    <LinkIcon size={15}/>
                                                    <span className="text-xs font-bold">CLIENT</span>
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent side="right" className="w-fit">
                                                <div className="flex justify-between space-x-4">
                                                    <Avatar>
                                                        <AvatarImage />
                                                        <AvatarFallback className="bg-primary text-white">{task.Contact?.contactName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-semibold">{task.Contact?.contactName}</h4>
                                                        <p className="text-sm text-muted-foreground">{task.Contact?.contactName}</p>
                                                        <div className="flex items-center pt-2">
                                                            <Contact2 className="mr-2 h-4 w-4 opacity-70" />
                                                            <span className="text-xs text-muted-foreground">Joined {task.Contact?.createdAt.toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </CardFooter>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger>
                                            <DropdownMenuItem className="flex items-center gap-2">
                                                <Trash size={15} />
                                                Delete Task
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <DropdownMenuItem className="flex items-center gap-2" onClick={handleClickEdit}>
                                            <Edit size={15} />
                                            Edit Task
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </Card>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the task and all associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex items-center">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive" onClick={handleDeleteTask}>
                                            Delete
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

export default KanbanTask;