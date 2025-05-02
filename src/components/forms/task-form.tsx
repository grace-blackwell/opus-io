'use client'

import {Contact, Project, Tag} from "@prisma/client";
import {z} from "zod";
import {useModal} from "@/providers/modal-provider";
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getAccountProjects, getAccountContacts, saveActivityLogNotification, searchContacts, upsertTask} from "@/lib/queries";
import {toast} from "sonner";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Briefcase, CheckIcon, ChevronsUpDownIcon, User2} from "lucide-react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import Loading from "@/app/(main)/account/[accountId]/kanbans/loading";
import {TaskWithTags} from "@/lib/types";
import TagCreator from "@/components/global/tag-creator";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";


type Props = {
    laneId: string;
    accountId: string;
    getNewTask: (task: TaskWithTags[0]) => void;
    defaultProjectId?: string;
};

const currencyNumberRegex = /^\d+(\.\d{1,2})?$/;

const TaskFormSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    value: z.string().refine((value) => currencyNumberRegex.test(value), {
        message: "Value must be a valid price.",
    }),
});

const TaskForm = ({ getNewTask, laneId, accountId, defaultProjectId }: Props) => {
    const {data: defaultData, setClose} = useModal();
    const router = useRouter();
    const [tags, setTags] = useState<Tag[]>([]);
    const [contact, setContact] = useState("");
    const [search, setSearch] = useState("");
    const [contactList, setContactList] = useState<Contact[]>([]);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [project, setProject] = useState(defaultProjectId || defaultData.task?.projectId || defaultData.task?.Project?.id || '')
    const [allProjects, setAllProjects] = useState<Project[]>([])

    const form = useForm<z.infer<typeof TaskFormSchema>>({
        mode: "onChange",
        resolver: zodResolver(TaskFormSchema),
        defaultValues: {
            name: defaultData.task?.name || "",
            description: defaultData.task?.description || "",
            value: String(defaultData.task?.value || 0),
        },
    })

    const isLoading = form.formState.isLoading;

    useEffect(() => {
        if (accountId) {
            const fetchData = async () => {
                // Load projects
                const projectsResponse = await getAccountProjects(accountId);
                if (projectsResponse) setAllProjects(projectsResponse);
                
                // Load contacts
                const contactsResponse = await getAccountContacts(accountId);
                if (contactsResponse) setContactList(contactsResponse);
            };
            fetchData();
        }
    }, [accountId]);

    useEffect(() => {
        if (defaultData.task) {
            form.reset({
                name: defaultData.task.name || "",
                description: defaultData.task?.description || "",
                value: String(defaultData.task?.value || 0),
            });
            if (defaultData.task.contactId) setContact(defaultData.task.contactId);
            if (defaultData.task.projectId) setProject(defaultData.task.projectId);
            else if (defaultData.task.Project?.id) setProject(defaultData.task.Project.id);

            // If we're editing a task, we already loaded all contacts in the first useEffect
            // No need to fetch contacts again based on the task's contact name
        }
    }, [defaultData]);

    const onSubmit = async (values: z.infer<typeof TaskFormSchema>) => {
        if (!laneId) return;
        try {
            const response = await upsertTask(
                {
                    ...values,
                    laneId,
                    id: defaultData.task?.id,
                    projectId: project,
                    ...(contact ? { contactId: contact } : {}),
                },
                tags
            );

            await saveActivityLogNotification(accountId, `Updated task ${response.id}`);

            toast.success('Saved task details');
            if (response) getNewTask(response);
            router.refresh();
        } catch (error) {
            toast('Oops...',{description: 'Something went wrong while saving task details.'});
        }
        setClose();
    };

    return (
        <Card className="w-full border-none">
            <CardHeader>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <FormField
                            disabled={isLoading}
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Name</FormLabel>
                                    <FormControl className={'border-none bg-input'}>
                                        <Input placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            disabled={isLoading}
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl className={'border-none bg-input'}>
                                        <Textarea placeholder="Description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={setProject} value={project}>
                            <SelectTrigger className={'border-none bg-input'}>
                                <SelectValue
                                    placeholder={
                                        <div className="flex items-center gap-2 className={'border-none bg-input'}">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage alt="contact" />
                                                <AvatarFallback className="bg-primary text-sm text-white">
                                                    <Briefcase size={14} />
                                                </AvatarFallback>
                                            </Avatar>

                                            <span className="text-sm text-muted-foreground">Not Assigned to Project</span>
                                        </div>
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className={'border-none'}>
                                {allProjects.map((projectItem) => (
                                    <SelectItem key={projectItem.id} value={projectItem.id}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-primary text-sm text-white">
                                                    <Briefcase size={14} />
                                                </AvatarFallback>
                                            </Avatar>

                                            <span className="text-sm text-muted-foreground">{projectItem.projectTitle}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormField
                            disabled={isLoading}
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Value</FormLabel>
                                    <FormControl className={'border-none bg-input'}>
                                        <Input placeholder="Value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <h3>Add tags</h3>
                        <TagCreator
                            accountId={accountId}
                            getSelectedTags={setTags}
                            defaultTags={defaultData.task?.Tags || []}
                        />

                        <FormLabel>Contact</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild className="w-full border-none bg-input">
                                <Button variant="outline" role="combobox" className="justify-between">
                                    {contact ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="bg-primary text-sm text-white">
                                                    {contactList.find((c) => c.id === contact)?.contactName?.slice(0, 2).toUpperCase() || "CO"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{contactList.find((c) => c.id === contact)?.contactName}</span>
                                        </div>
                                    ) : (
                                        "Select Contact..."
                                    )}
                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Search..."
                                        className="h-9"
                                        value={search}
                                        onChangeCapture={async (value) => {
                                            //@ts-ignore
                                            setSearch(value.target.value);
                                            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                                            saveTimerRef.current = setTimeout(async () => {
                                                const response = await searchContacts(
                                                    //@ts-ignore
                                                    value.target.value,
                                                    accountId
                                                );
                                                setContactList(response);
                                                setSearch("");
                                            }, 1000);
                                        }}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No Contact found.</CommandEmpty>
                                        <CommandGroup>
                                            {contactList.map((c) => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={c.id}
                                                    onSelect={(currentValue) => {
                                                        setContact(currentValue === contact ? "" : currentValue);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarFallback className="bg-primary text-sm text-white">
                                                                {c.contactName?.slice(0, 2).toUpperCase() || "CO"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{c.contactName}</span>
                                                    </div>
                                                    <CheckIcon className={cn("ml-auto h-4 w-4", contact === c.id ? "opacity-100" : "opacity-0")} />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button className="w-20 mt-4" disabled={isLoading} type="submit">
                            {form.formState.isSubmitting ? <Loading /> : "Save"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );

}

export default TaskForm