"use client";

import React, { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { useModal } from "@/providers/modal-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthUserWithSidebarOptions } from "@/lib/types";
import {
  getAuthUserDetails,
  saveActivityLogNotification,
  updateUser,
} from "@/lib/queries";
import * as z from "zod";
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
import FileUpload from "@/components/global/file-upload";
import { Input } from "@/components/ui/input";
import Loading from "@/components/global/loading";
import { Button } from "@/components/ui/button";

type Props = {
  id: string | null;
  userData?: Partial<User>;
};

const UserDetails = ({ id, userData }: Props) => {
  const { data, setClose } = useModal();
  const router = useRouter();
  const [, setAuthUserData] = useState<AuthUserWithSidebarOptions | null>(null);

  useEffect(() => {
    if (data.user) {
      const fetchDetails = async () => {
        const response = await getAuthUserDetails();
        if (response) setAuthUserData(response);
      };
      fetchDetails();
    }
  }, [data]);

  const userDataSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string(),
  });

  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: "onChange",
    defaultValues: {
      firstName: userData ? userData.firstName : data?.user?.firstName,
      lastName: userData ? userData.lastName : data?.user?.lastName,
      email: userData ? userData.email : data?.user?.email,
      avatarUrl: userData ? userData.avatarUrl : data?.user?.avatarUrl,
    },
  });

  useEffect(() => {
    if (data.user) {
      form.reset(data.user);
    }
    if (userData) {
      form.reset(userData);
    }
  }, [userData, data, form]);

  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    if (!id) return;
    if (userData || data.user) {
      const userUpdateData = {
        id: userData?.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        avatarUrl: values.avatarUrl,
      };
      const updatedUser = await updateUser(userUpdateData);

      await saveActivityLogNotification(
        userData?.accountId || "",
        `Updated user details`
      );

      if (updatedUser) {
        toast.success("User details updated successfully");
        setClose();
        router.refresh();
      } else {
        toast.error("Oops...", {
          description: "Something went wrong while updating user details.",
        });
      }
    } else {
      console.log("Error: Could not submit user details form");
    }
  };

  return (
    <Card className="w-full border-none rounded-none">
      <CardHeader>
        <CardTitle>User Details</CardTitle>
        <CardDescription>Add or update your information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile picture</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="avatar"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <FormField
                disabled={form.formState.isSubmitting}
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input required placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={form.formState.isSubmitting}
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input required placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={form.formState.isSubmitting}
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loading /> : "Save User Details"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UserDetails;
