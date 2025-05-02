'use client'

import React from 'react'
import {Kanban} from "@prisma/client";
import {useModal} from "@/providers/modal-provider";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Check, ChevronsUpDown, Plus} from "lucide-react";
import CustomModal from "@/components/global/custom-modal";
import {Command, CommandEmpty, CommandGroup, CommandItem} from "@/components/ui/command";
import Link from "next/link";
import {cn} from "@/lib/utils";
import CreateKanbanForm from "@/components/forms/create-kanban";

type Props = {
    accountId: string
    kanbans: Kanban[]
    kanbanId: string
}

const KanbanInfobar = ({ accountId, kanbans, kanbanId }: Props) => {
    const {setOpen: setOpenModal, setClose} = useModal()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(kanbanId)

    const handleClickCreateKanban = () => {
        setOpenModal(
            <CustomModal
                title={"Create a Kanban Board"}
                subheading={"Kanban boards allow you to group tasks into lanes and track your processes"}
            >
                <CreateKanbanForm accountId={accountId}/>
            </CustomModal>
        )
    }

    return (
        <div>
            <div className='flex items-end gap-2'>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant='outline'
                            role={'combobox'}
                            aria-expanded={open}
                            className={'w-[200px] justify-between'}
                        >
                            {value ? kanbans.find((kanban) =>
                                kanban.id === value)?.name : "Select a kanban board..."}
                            <ChevronsUpDown className={'ml-2 h-4 w-4 shrink-0 opacity-50'}/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Command>
                            <CommandEmpty>No kanban boards.</CommandEmpty>
                            <CommandGroup>
                                {kanbans.map((kanban) => (
                                    <Link key={kanban.id} href={`/account/${accountId}/kanbans/${kanban.id}`}>
                                        <CommandItem
                                            key={kanban.id}
                                            value={kanban.id}
                                            onSelect={(currentValue) => {
                                                setValue(currentValue)
                                                setOpen(false)
                                            }}>
                                            <Check className={cn('mr-2 h-4 w-4', value === kanban.id ? 'opacity-100' : 'opacity-0')} />
                                            {kanban.name}
                                        </CommandItem>
                                    </Link>
                                ))}
                                <Button
                                    variant={'secondary'}
                                    className={'flex gap-2 w-full mt-4'}
                                    onClick={handleClickCreateKanban}>
                                    <Plus size={15} />
                                    Create Kanban
                                </Button>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default KanbanInfobar