"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import { UserButton } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BellIcon, Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FullCalendarComponent from "./full-calendar";

// Define a more specific type for a single notification with user
type SingleNotificationWithUser = {
  User: {
    id: string;
    accountId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
  };
  id: string;
  notification: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
};

type Props = {
  notifications: SingleNotificationWithUser[] | undefined;
  className?: string;
};

const InfoBar = ({ notifications }: Props) => {
  return (
    <>
      <div
        className={twMerge(
          "fixed z-[20] md:left-[300px] left-0 right-0 top-0 p-4 bg-muted backdrop-blur-md flex gap-4 items-center"
        )}
      >
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger>
              <CalendarIcon className="text-primary-content rounded-full w-9 h-9 cursor-pointer hover:bg-accent px-2 py-1 transition-all duration-500 ease-in-out" />
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-[1000px] p-2 overflow-auto max-h-[80vh] bg-base-100 shadow-lg border-none">
              <FullCalendarComponent />
            </PopoverContent>
          </Popover>

          <ListChecks className="text-primary-content rounded-full w-9 h-9 cursor-pointer hover:bg-accent px-2 py-1 transition-all duration-500 ease-in-out" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <UserButton />
          <Sheet>
            <SheetTrigger>
              <div className="rounded-full w-8 h-8 cursor-pointer bg-primary flex items-center justify-center text-white hover:bg-accent px-2 py-1 transition-all duration-500 ease-in-out">
                <BellIcon size={17} />
              </div>
            </SheetTrigger>
            <SheetContent className="mt-4 mr-4 pr-4 overflow-scroll">
              <SheetHeader className="text-left">
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription></SheetDescription>
              </SheetHeader>
              {Array.isArray(notifications) &&
                notifications.length > 0 &&
                notifications.map(
                  (notification: SingleNotificationWithUser) => (
                    <div
                      key={notification.id}
                      className="flex flex-col gap-y-2 mb-2 overflow-x-scroll text-ellipsis"
                    >
                      <div className="flex gap-2">
                        <Avatar>
                          <AvatarImage
                            src={notification.User.avatarUrl}
                            alt="Profile Picture"
                          />
                          <AvatarFallback className="bg-primary">
                            {notification.User.firstName
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p>
                            <span className="font-bold">
                              {notification.notification.split("|")[0]}
                            </span>
                            <span className="text-muted-foreground">
                              {notification.notification.split("|")[1]}
                            </span>
                            <span className="font-bold">
                              {notification.notification.split("|")[2]}
                            </span>
                          </p>
                          <small className="text-xs text-muted-foreground">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  )
                )}
              {(!Array.isArray(notifications) ||
                notifications.length === 0) && (
                <div className="flex items-center justify-center mb-4 text-muted-foreground">
                  No Notifications
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default InfoBar;
