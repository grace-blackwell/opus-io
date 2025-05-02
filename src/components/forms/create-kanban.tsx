"use client";
import { saveActivityLogNotification, upsertKanban } from "@/lib/queries";
import { useModal } from "@/providers/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Kanban } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "../global/loading";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { toast } from "sonner"

interface CreateKanbanFormProps {
    defaultData?: Kanban;
    accountId: string;
}

const CreateKanbanFormSchema = z.object({
    name: z.string().min(1),
});

const CreateKanbanForm: React.FC<CreateKanbanFormProps> = ({ defaultData, accountId }) => {
    const { setClose } = useModal();
    const router = useRouter();

    const form = useForm<z.infer<typeof CreateKanbanFormSchema>>({
        mode: "onChange",
        resolver: zodResolver(CreateKanbanFormSchema),
        defaultValues: {
            name: defaultData?.name || "",
        },
    });

    useEffect(() => {
        if (defaultData) {
            form.reset({
                name: defaultData?.name || "",
            });
        }
    }, [defaultData]);

    const isLoading = form.formState.isLoading;

    const onSubmit = async (values: z.infer<typeof CreateKanbanFormSchema>) => {
        if (!accountId) return;

        try {
            const response = await upsertKanban({
                ...values,
                id: defaultData?.id,
                accountId,
            });

            await saveActivityLogNotification(accountId,`Updated a pipeline | ${response?.name}`);

            toast.success("Saved pipeline details");
            router.refresh();
        } catch (err) {
            console.log(err);
            toast.error('Oops...',{description: "Could not save pipeline details"});
        }
        setClose();
    };

    return (
        <Card className="w-full ">
            <CardHeader>
                <CardTitle>Kanban Details</CardTitle>
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
                                    <FormLabel>Kanban Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button className="w-20 mt-4" disabled={isLoading} type="submit">
                            {form.formState.isSubmitting ? <Loading /> : "Save"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default CreateKanbanForm;