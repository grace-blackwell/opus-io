"use client";

import React, { useEffect } from "react";
import { Lane } from "@prisma/client";
import { useModal } from "@/providers/modal-provider";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getKanbanDetails,
  saveActivityLogNotification,
  upsertLane,
} from "@/lib/queries";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/global/loading";

type Props = {
  kanbanId: string;
  defaultData?: Lane;
};

export const CreateLaneForm: React.FC<Props> = ({
  kanbanId,
  defaultData,
}: Props) => {
  const { setClose } = useModal();
  const router = useRouter();

  const CreateLaneFormSchema = z.object({
    name: z.string().min(1),
  });

  const form = useForm<z.infer<typeof CreateLaneFormSchema>>({
    resolver: zodResolver(CreateLaneFormSchema),
    mode: "onChange",
    defaultValues: {
      name: defaultData?.name || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        name: defaultData.name || "",
      });
    }
  }, [defaultData, form]);

  const isLoading = form.formState.isLoading;

  const onSubmit = async (values: z.infer<typeof CreateLaneFormSchema>) => {
    if (!kanbanId) return;
    try {
      const response = await upsertLane({
        ...values,
        id: defaultData?.id,
        kanbanId: kanbanId,
        order: defaultData?.order,
      });

      const d = await getKanbanDetails(kanbanId);
      if (!d) return;

      await saveActivityLogNotification(
        d.accountId,
        `Updated a lane: ${response.name}`
      );

      toast.success("Successfully saved lane details");
      router.refresh();
    } catch {
      toast.error("Oops...", {
        description: "Something went wrong while saving lane details.",
      });
    }
    setClose();
  };

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Lane Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lane Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lane Name" {...field} />
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

export default CreateLaneForm;
