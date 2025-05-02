import React from 'react'
import {GetMediaFiles} from "@/lib/types"
import MediaUploadButton from "@/components/media/upload-button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import MediaCard from "@/components/media/media-card";
import {FolderSearch} from "lucide-react";

type Props = {
    data: GetMediaFiles
    accountId: string
}

const MediaComponent = ({data, accountId}: Props) => {
	return (
		<div className='flex flex-col gap-4 h-full w-full'>
            <div className='flex justify-between items-center'>
                <h1 className='text-4xl'>Media Bucket</h1>
                <MediaUploadButton accountId={accountId} />
            </div>
            <Command className='bg-transparent'>
                <CommandInput placeholder='Search for file name...' />
                <CommandList className='pb-40 max-h-full'>
                    <CommandEmpty>No Media Files.</CommandEmpty>
                    <CommandGroup heading='Media Files'>
                        <div className='flex flex-wrap gap-4 pt-4'>
                            {data?.Media.map((file) =>
                                (<CommandItem
                                    key={file.id}
                                    className='p-0 max-w-[300px] w-full rounded-lg !bg-transparent !font-medium !text-foreground'>
                                    <MediaCard file={file}/>
                                </CommandItem>)
                            )}
                            {!data?.Media.length && (
                                <div className='flex items-center justify-center w-full flex-col'>
                                    <FolderSearch size={200} className='dark:text-muted text-foreground'/>
                                    <p className='text-muted-foreground'>No files to show.</p>
                                </div>
                            )}
                        </div>
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    )
}

export default MediaComponent