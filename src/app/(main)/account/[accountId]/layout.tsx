import React from 'react'
import {getNotificationAndUser, verifyAndAcceptAccount} from "@/lib/queries";
import {currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import Sidebar from "@/components/sidebar";
import BlurPage from "@/components/global/blur-page";
import InfoBar from "@/components/global/infobar";

type Props = {
    children: React.ReactNode
    params: { accountId: string }
}

const layout = async ({children, params}: Props) => {

    const accountId = await verifyAndAcceptAccount()
    const user = await currentUser()

    if (!user) {
        return redirect('/')
    }

    if(!accountId) {
        return redirect('/account')
    }

    let allNoti: any = [];
    const notifications = await getNotificationAndUser(accountId);
    if (notifications) allNoti = notifications;

  return (
    <div className='h-screen overflow-hidden'>
        <Sidebar id={accountId} />

        <div className='md:pl-[300px]'>
            <InfoBar notifications={allNoti}/>
            <div className='relative'>
                <BlurPage>{children}</BlurPage>
            </div>
        </div>
    </div>
  )
}

export default layout