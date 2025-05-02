import React from 'react'
import {getAuthUserDetails} from "@/lib/queries";
import MenuOptions from "@/components/sidebar/menu-options";

type Props = {
    id: string
}

const Sidebar = async ({id}: Props) => {
    const user = await getAuthUserDetails()
    if (!user) return null

    if (!user.Account) return

    const details = user?.Account
    if (!details) return null

    let sidebarLogo = user.Account.logo || '/logo.png'

    const sidebarOpt = user.Account.SidebarOption || []

    return (
        <>
            <MenuOptions
                defaultOpen={true}
                details={details}
                id={id}
                sidebarLogo={sidebarLogo}
                sidebarOpt={sidebarOpt}
                user={user}
            />

            <MenuOptions
                details={details}
                id={id}
                sidebarLogo={sidebarLogo}
                sidebarOpt={sidebarOpt}
                user={user}
            />
        </>
    )
}

export default Sidebar