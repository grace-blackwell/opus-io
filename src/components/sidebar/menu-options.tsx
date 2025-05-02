'use client'

import React, {useEffect, useMemo, useState} from 'react'
import {SidebarOption} from "@prisma/client";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Menu} from "lucide-react";
import {clsx} from "clsx";
import {AspectRatio} from "@/components/ui/aspect-ratio";
import Image from "next/image";
import {Separator} from "@/components/ui/separator";
import {Icons} from "@/lib/constants"
import {CiPalette} from "react-icons/ci";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import Link from "next/link";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter
} from "@/components/ui/drawer";
import { ColorThemeSelector } from "@/components/global/color-theme-selector";

type Props = {
    defaultOpen?: boolean
    sidebarOpt: SidebarOption[]
    sidebarLogo: string
    details: any
    user: any
    id: string
}

const MenuOptions = ({defaultOpen, sidebarOpt, sidebarLogo, details, user, id}: Props) => {
    const [isMounted, setIsMounted] = useState(false)

    const openState = useMemo(
        () => (defaultOpen ? {open: true} : {}),
        [defaultOpen]
    )

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return

    return (
        <Sheet modal={false}
               {...openState}
        >
            <div className="absolute left-6 top-4 z-[100] flex gap-2">
                <SheetTrigger asChild className="md:!hidden flex">
                    <Button variant='outline' size={'icon'} className={'bg-transparent'}>
                        <Menu />
                    </Button>
                </SheetTrigger>
            </div>
            <SheetContent title="Menu Options" showX={!defaultOpen} side={'left'}
                          className={clsx('bg-background/80 backdrop-blur-xl fixed top-0 border-r pt-6',
                              {
                                  'hidden md:inline-block z-0 w-[-300px]': defaultOpen,
                                  'inline-block md:hidden z-[100 w-full': !defaultOpen,
                              }
                          )}
            >
                <div>
                    <AspectRatio ratio={16 / 5}>
                        <Image src={sidebarLogo} fill className='rounded-md object-contain' alt='sidebar logo'/>
                    </AspectRatio>
                    <Button className='w-full my-4 flex items-center justify-center py-8'
                            variant='ghost'>
                        <div className='flex items-center text-center gap-2'>
                            <div className='flex flex-col'>
                                <h2 className='text-lg text-primary'>{details.accountName}</h2>
                                {details.title}
                                <span className='text-muted-foreground'>{details.accountEmail}</span>
                            </div>
                        </div>
                    </Button>
                </div>
                <div className="flex items-center justify-between pl-4 mb-2">
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button
                                variant='secondary'
                                size={'icon'}
                                title="Not feeling this color theme? Change it here."
                                onClick={() => {}}
                            >
                                <CiPalette className="h-6 w-6"/>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className='mx-auto w-full max-w-sm'>
                                <DrawerHeader className='text-center'>
                                    <DrawerTitle>Change Theme</DrawerTitle>
                                    <DrawerDescription>Choose a color theme for your dashboard.</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-4">
                                    <ColorThemeSelector />
                                </div>
                                <DrawerFooter>
                                    <p className="text-xs text-muted-foreground text-center">
                                        The selected theme will be saved for your next visit.
                                    </p>
                                </DrawerFooter>
                            </div>
                        </DrawerContent>
                    </Drawer>
                    <p className='text-muted-foreground text-xs pr-10'> MENU </p>
                + </div>
            <Separator className='mb-4'/>
            <nav className='relative'>
                <Command className='rounded-lg overflow-visible bg-transparent'>
                    <CommandInput placeholder='Search...'/>
                    <CommandList className='pb-16 overflow-visible'>
                        <CommandEmpty>No Results Found.</CommandEmpty>
                        <CommandGroup className='overflow-visible'>
                            {sidebarOpt.map((sidebarOptions) => {
                                let val;
                                const result = Icons.find( (icon)  =>
                                            icon.value === sidebarOptions.icon
                                        )
                                        if (result) {
                                            val = <result.path />
                                        }
                                        return <CommandItem 
                                            key={sidebarOptions.id} 
                                            className='md:w-[320px] w-full pt-4'
                                        >
                                            <Link href={sidebarOptions.link} className='flex items-center gap-2 hover:bg-transparent rounded-md transition-all md:w-full w-[320px]'>
                                                {val}
                                                <span>{sidebarOptions.name}</span>
                                            </Link>
                                        </CommandItem>
                                    })}
                                </CommandGroup>
                            </CommandList>
                    </Command>
                </nav>
            </SheetContent>
        </Sheet>
	)
}

export default MenuOptions