"use client";

import { Tag } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import TagComponent from "./tag";
import { PlusCircleIcon, TrashIcon, X } from "lucide-react";
import { deleteTag, getTagsForAccount, saveActivityLogNotification, upsertTag } from "@/lib/queries";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {toast} from "sonner";
import {nanoid} from "nanoid";

type Props = {
    accountId: string;
    getSelectedTags: (tags: Tag[]) => void;
    defaultTags?: Tag[];
};

const TagColors = ["BLUE", "ORANGE", "ROSE", "PURPLE", "GREEN"] as const;
export type TagColor = (typeof TagColors)[number];

const TagCreator = ({ getSelectedTags, accountId, defaultTags }: Props) => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>(defaultTags || []);
    const [tags, setTags] = useState<Tag[]>([]);
    const router = useRouter();
    const [value, setValue] = useState("");
    const [selectedColor, setSelectedColor] = useState("");

    useEffect(() => {
        getSelectedTags(selectedTags);
    }, [selectedTags]);

    useEffect(() => {
        if (accountId) {
            const fetchData = async () => {
                const response = await getTagsForAccount(accountId);
                if (response) setTags(response.Tags);
            };
            fetchData();
        }
    }, [accountId]);

    const handleDeleteSelection = (tagId: string) => {
        setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
    };

    const handleAddTag = async () => {
        if (!value) {
            toast.error('Tag must have a name.');
            return;
        }
        if (!selectedColor) {
            toast.error('Please select a color.');
            return;
        }
        const tagData: Tag = {
            color: selectedColor,
            createdAt: new Date(),
            id: nanoid(),
            name: value,
            accountId,
            updatedAt: new Date(),
        };

        setTags([...tags, tagData]);
        setValue("");
        setSelectedColor("");
        try {
            const response = await upsertTag(accountId, tagData);
            toast.success('Tag created.');

            await saveActivityLogNotification(accountId, `Updated a tag | ${response.name}`);
        } catch (error) {
            toast('Oops...', {description: 'Something went wrong while creating the tag.'});
        }
    };

    const handleAddSelections = (tag: Tag) => {
        if (selectedTags.every((t) => t.id !== tag.id)) {
            setSelectedTags([...selectedTags, tag]);
        }
    };
    const handleDeleteTag = async (tagId: string) => {
        setTags(tags.filter((tag) => tag.id !== tagId));
        try {
            const response = await deleteTag(tagId);
            toast.success('Tag has been deleted.');

            await saveActivityLogNotification(accountId, `Deleted a tag | ${response.name}`);

            router.refresh();
        } catch (error) {
            toast.error('Oops...', {description: 'Something went wrong while deleting the tag.'});
        }
    };

    return (
        <AlertDialog>
            <Command className="bg-transparent">
                {!!selectedTags.length && (
                    <div className="flex flex-wrap gap-2 p-2 bg-background border-none">
                        {selectedTags.map((tag) => (
                            <div key={tag.id} className="flex items-center">
                                <TagComponent title={tag.name} colorName={tag.color} />
                                <X size={14} className="text-muted-foreground cursor-pointer" onClick={() => handleDeleteSelection(tag.id)} />
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2 my-2">
                    {TagColors.map((colorName) => (
                        <TagComponent key={colorName} selectedColor={setSelectedColor} title="" colorName={colorName} />
                    ))}
                </div>
                <div className="relative">
                    <CommandInput placeholder="Search for tag..." value={value} onValueChange={setValue} />
                    <PlusCircleIcon onClick={handleAddTag} size={20} className="absolute top-1/2 transform -translate-y-1/2 right-2 hover:text-primary transition-all cursor-pointer text-muted-foreground" />
                </div>
                <CommandList>
                    <CommandSeparator />
                    <CommandGroup heading="Tags">
                        {tags.map((tag) => (
                            <CommandItem key={tag.id} className="hover:!bg-secondary !bg-transparent flex items-center justify-between !font-light cursor-pointer">
                                <div onClick={() => handleAddSelections(tag)}>
                                    <TagComponent title={tag.name} colorName={tag.color} />
                                </div>

                                <AlertDialogTrigger>
                                    <TrashIcon size={16} className="cursor-pointer text-muted-foreground hover:text-rose-400 transition-all" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-left">Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-left">This action cannot be undone. This will permanently delete your the tag and remove it from our servers.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="items-center">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive" onClick={() => handleDeleteTag(tag.id)}>
                                            Delete Tag
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandEmpty>No results found.</CommandEmpty>
                </CommandList>
            </Command>
        </AlertDialog>
    );
};

export default TagCreator;