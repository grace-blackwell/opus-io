'use client'

import React from 'react'
import {Media} from "@prisma/client";
import {useRouter} from "next/navigation";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import {Copy, MoreHorizontal, Trash} from "lucide-react";
import {toast} from "sonner";
import {deleteMedia, saveActivityLogNotification} from "@/lib/queries";

type Props = {
    file: Media
}

const MediaCard = ({file}: Props) => {
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    return (
        <AlertDialog>
            <DropdownMenu>
                <article className='border w-full rounded-lg bg-muted'>
                    <div className='relative w-full h-40'>
                        <Image
                            src={file.link}
                            alt="image preview"
                            fill
                            className='object-cover rounded-lg' />
                    </div>
                    <p className='opacity-0 h-0 w-0'>{file.name}</p>
                    <div className='p-4 relative'>
                        <p className='text-muted-foreground'>
                            {file.createdAt.toString()}
                        </p>
                        <p>{file.name}</p>
                        <div className='absolute top-4 right-4 p-[1px] cursor-pointer'>
                            <DropdownMenuTrigger>
                                <MoreHorizontal />
                            </DropdownMenuTrigger>
                        </div>
                    </div>

                    <DropdownMenuContent>
                        <DropdownMenuLabel>Menu</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className='flex gap-2'
                            onClick={() => {
                                navigator.clipboard.writeText(file.link)
                                toast.success('Media link copied to clipboard')
                            }}>
                            <Copy size={15}/> Copy Image Link
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className='flex gap-2'>
                                <Trash size={15}/> Delete File
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </article>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className='text-left'>
                        Are you sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className='text-left'>
                        Once deleted, you will no longer have access to this file from your site builder.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className='flex items-center'>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        className='bg-destructive hover:bg-destructive/90'
                        onClick={async () => {
                            setLoading(true)
                            const response = await deleteMedia(file.id)
                            await saveActivityLogNotification(response.accountId, `Deleted media file: ${file.name}`)
                            toast.success(`Successfully deleted media file: ${file.name}`)
                            setLoading(false)
                            router.refresh()
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default MediaCard