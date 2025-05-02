import React from 'react'
import {currentUser} from "@clerk/nextjs/server";
import {db} from "@/lib/db";
import AccountDetails from "@/components/forms/account-details"
import UserDetails from "@/components/forms/user-details"

type Props = {
    params: {accountId: string}
}

const SettingsPage = async ({params}: Props) => {
    const authUser = await currentUser()
    if (!authUser) return null

    const userDetails = await db.user.findUnique(
        {
            where: {
                email: authUser.emailAddresses[0].emailAddress
            }
        }
    )
    if (!userDetails) return null

    const accountDetails = await db.account.findUnique(
        {
            where: {
                id: params.accountId
            }
        }
    )

    if(!accountDetails) return null

    return (
        <div className='flex flex-col gap-4 items-center justify-center p-4 md:p-8 max-w-4xl'>
            <h1 className="text-xl font-bold text-left">Update your account details</h1>
            <AccountDetails data={accountDetails}/>
            <div className='p-6'>
                <h1 className="text-xl font-bold text-left">Update your user details</h1>
                <p>Your user details may be different from the account details if you are using a business name/email address.</p>
            </div>
            <UserDetails id={params.accountId} userData={userDetails}/>
        </div>
    )
}

export default SettingsPage