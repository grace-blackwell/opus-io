"use client";

import React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createMedia, saveActivityLogNotification } from "@/lib/queries";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import FileUpload from "@/components/global/file-upload";
import { Button } from "@/components/ui/button";

type Props = {
  accountId: string;
};

const formSchema = z.object({
  link: z.string().min(1, { message: "Media file is required" }),
  name: z.string().min(1, { message: "Name is required" }),
});

const UploadMediaForm = ({ accountId }: Props) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      link: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createMedia(accountId, values);
      await saveActivityLogNotification(
        accountId,
        `New Media File Added: ${values.name}`
      );

      toast.success("Media added successfully");
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("Oops...", {
        description: "Something went wrong while adding media.",
      });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Media Information</CardTitle>
        <CardDescription>Please enter the file details</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a name for the file" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pt-4">Media File</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="media"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              Upload Media
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UploadMediaForm;
