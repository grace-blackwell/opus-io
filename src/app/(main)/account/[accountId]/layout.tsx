import React from "react";
import { getNotificationAndUser, verifyAndAcceptAccount } from "@/lib/queries";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import BlurPage from "@/components/global/blur-page";
import InfoBar from "@/components/global/infobar";

type Props = {
  children: React.ReactNode;
};

const layout = async ({ children }: Props) => {
  const accountId = await verifyAndAcceptAccount();
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  if (!accountId) {
    return redirect("/account");
  }

  // Initialize with empty array that matches NotificationWithUser type
  let allNoti: {
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
  }[] = [];

  const notifications = await getNotificationAndUser(accountId);

  // Only assign if notifications exist and ensure each notification has required User property
  if (notifications) {
    // Filter out notifications where User is null or undefined
    allNoti = notifications.filter(
      (notification): notification is (typeof allNoti)[number] =>
        !!notification.User && typeof notification.User.accountId === "string"
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar id={accountId} />

      <div className="md:pl-[300px]">
        <InfoBar notifications={allNoti} />
        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  );
};

export default layout;
