"use client"

import {User} from '@clerk/nextjs/server'
import React from 'react'
import Link from "next/link";
import {UserButton, useUser} from "@clerk/nextjs";

type Props = {
    user?: null | User
}

const Navigation = ({ user }: Props) => {
    return (
        <div className="p-4 flex items-center justify-between relative">
            <aside className="flex items-center gap-2">
                {/*<Image src={'./assets/opus-logo.svg'}*/}
                {/*width={70}*/}
                {/*height={70}*/}
                {/*alt="Opus Logo"/>*/}
                <span className="text-xl font-bold bg-gradient-to-tr from-orange-500 to-purple-700 text-transparent bg-clip-text">Opus.</span>
            </aside>
            <nav className="hidden md:block absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%]">
                <ul className="flex items-center justify-center gap-8">
                    <Link href={"#"}>Pricing</Link>
                    <Link href={"#"}>About</Link>
                    <Link href={"#"}>Documentation</Link>
                    <Link href={"#"}>Features</Link>
                </ul>
            </nav>
            <aside className="flex gap-2 items-center">
                <Link href={"/account"} className="bg-primary text-white p-2 px-4 rounded-md hover:bg-secondary">
                    Login
                </Link>
                <UserButton />
            </aside>
        </div>
    )
}

export default Navigation