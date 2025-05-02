import React from 'react'
import {getAuthUserDetails} from "@/lib/queries";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import DeleteButton from "./_components/delete-button";
import CreateContactButton from "./_components/create-contact-button";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

type Props = {
    params: {accountId: string};
}

const AllContactsPage = async ({params}: Props) => {
    const user = await getAuthUserDetails()
    if (!user || !user.Account) return null;

    const contacts = await db.contact.findMany({
        where: {
            accountId: params.accountId
        },
        include: {
            Tags: true
        },
        orderBy: {
            contactName: 'asc'
        }
    });

    // Get all tags for the account to use in filtering
    const tags = await db.tag.findMany({
        where: {
            accountId: params.accountId
        }
    });

    return (
        <AlertDialog>
            <div className='flex flex-col'>
                <div className="flex justify-between items-center mb-6">
                    <CreateContactButton user={user} className='w-[200px]'/>
                    <div className="flex gap-2">
                        {tags.map(tag => (
                            <Badge 
                                key={tag.id} 
                                style={{backgroundColor: tag.color}}
                                className="cursor-pointer hover:opacity-80"
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                </div>
                <Command className='rounded-lg bg-transparent max-w-4xl shadow-sm'>
                    <CommandInput placeholder='Search Contacts...' className=''/>
                    <CommandList>
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup heading="Contacts">
                            {contacts.length > 0
                                ? (contacts.map((contact) => (
                                    <CommandItem key={contact.id} className='max-w-3xl h-auto min-h-20 !bg-background my-2 text-primary border-[1px] border-border p-4 rounded-lg hover:!bg-background cursor-pointer transition-all'>
                                        <Link href={`/contacts/${contact.id}`} className='flex gap-4 w-full h-full'>
                                            <div className='flex flex-col justify-between w-full'>
                                                <div className='flex flex-col'>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{contact.contactName}</span>
                                                        <div className="flex gap-1">
                                                            {contact.Tags.map(tag => (
                                                                <Badge 
                                                                    key={tag.id} 
                                                                    style={{backgroundColor: tag.color}}
                                                                    className="text-xs"
                                                                >
                                                                    {tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className='text-muted-foreground text-xs'>
                                                        {contact.contactEmail}
                                                    </span>
                                                    {contact.contactPhone && (
                                                        <span className='text-muted-foreground text-xs'>
                                                            {contact.contactPhone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <AlertDialogTrigger asChild>
                                            <Button size={'sm'} variant={'destructive'} className='text-red-600 bg-white w-20 hover:bg-red-600 hover:text-white'>
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className='text-left'>
                                                    Are you sure?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className='text-left'>
                                                    This action cannot be undone. This will permanently delete the contact and all related data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className='flex items-center'>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction className='bg-destructive hover:bg-destructive'>
                                                    <DeleteButton contactId={contact.id} />
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </CommandItem>
                                    )
                                ))
                                : <div className='text-muted-foreground text-center p-4'>
                                    No Contacts
                                </div>
                            }
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </AlertDialog>
    )
}

export default AllContactsPage