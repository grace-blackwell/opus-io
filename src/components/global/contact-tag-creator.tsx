"use client";

import {ContactTag} from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { PlusCircleIcon, TrashIcon, X } from "lucide-react";
import {
    deleteContactTag,
    getContactTagsForAccount,
    saveActivityLogNotification, upsertContactTag,
} from "@/lib/queries";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {toast} from "sonner";
import {nanoid} from "nanoid";
import ContactTagComponent from "@/components/global/contact-tag";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";

type Props = {
    accountId: string;
    getSelectedContactTags: (contactTags: ContactTag[]) => void;
    defaultTags?: ContactTag[];
};

const TagColors = ["BLUE", "ORANGE", "ROSE", "PURPLE", "GREEN"] as const;
export type TagColor = (typeof TagColors)[number];

// Extended ContactTag type to include custom color hex
interface ExtendedContactTag extends ContactTag {
    colorHex?: string;
}

const ContactTagCreator = ({ getSelectedContactTags, accountId, defaultTags }: Props) => {
    const [selectedContactTags, setSelectedContactTags] = useState<ExtendedContactTag[]>(defaultTags || []);
    const [contactTags, setContactTags] = useState<ExtendedContactTag[]>([]);
    const router = useRouter();
    const [value, setValue] = useState("");
    const [customColorHex, setCustomColorHex] = useState("#57acea"); // Default color
    const [isUsingCustomColor, setIsUsingCustomColor] = useState(false);

    useEffect(() => {
        console.log('Selected contact tags changed:', selectedContactTags);
        getSelectedContactTags(selectedContactTags);
    }, [selectedContactTags]);

    useEffect(() => {
        if (accountId) {
            const fetchData = async () => {
                console.log('Fetching contact tags for account:', accountId);
                const response = await getContactTagsForAccount(accountId);
                console.log('Contact tags response:', response);
                if (response && response.ContactTags) {
                    // Process the tags to handle custom colors
                    const processedTags = response.ContactTags.map(tag => {
                        // Check if the color field contains a custom color
                        if (tag.color.startsWith('CUSTOM:')) {
                            const [_, colorHex] = tag.color.split(':');
                            return {
                                ...tag,
                                colorHex,
                                color: 'CUSTOM'
                            };
                        }
                        return tag;
                    });
                    
                    console.log('Setting contact tags:', processedTags);
                    setContactTags(processedTags);
                }
            };
            fetchData();
        }
    }, [accountId]);

    const handleDeleteSelection = (contactTagId: string) => {
        setSelectedContactTags(selectedContactTags.filter((contactTag) => contactTag.id !== contactTagId));
    };

    // Handle adding a predefined tag directly
    const handleAddPredefinedTag = async (title: string, colorName: string) => {
        console.log('Adding predefined tag:', title, colorName);
        
        // Check if this tag already exists
        const existingTag = contactTags.find(tag => 
            tag.name.toLowerCase() === title.toLowerCase() && tag.color === colorName);
        
        if (existingTag) {
            console.log('Found existing tag:', existingTag);
            // If tag exists, just add it to selected tags
            handleAddSelections(existingTag);
        } else {
            console.log('Creating new predefined tag');
            // Create a new tag
            const tagData: ExtendedContactTag = {
                color: colorName,
                createdAt: new Date(),
                id: nanoid(),
                name: title,
                accountId,
                updatedAt: new Date(),
            };

            try {
                // Then save to backend first to get the correct ID
                const response = await upsertContactTag(accountId, tagData);
                console.log('Predefined contact tag created:', response);
                toast.success('Contact Tag created.');

                // Add the newly created tag to the UI
                const newTag = {...response};
                setContactTags(prevTags => [...prevTags, newTag]);
                
                // Add the newly created tag to the selected tags
                handleAddSelections(newTag);

                await saveActivityLogNotification(accountId, `Added a contact tag | ${response.name}`);
            } catch (error) {
                console.error('Error creating predefined tag:', error);
                toast('Oops...', {description: 'Something went wrong while creating the contact tag.'});
            }
        }
    };

    // Handle adding a custom tag
    const handleAddContactTag = async () => {
        console.log('Adding custom tag with name:', value, 'and color:', customColorHex);
        
        if (!value) {
            toast.error('Tag must have a name.');
            return;
        }
        
        // For custom tags, we always use the custom color
        if (!isUsingCustomColor) {
            toast.error('Please choose a color.');
            return;
        }
        
        const tagData: ExtendedContactTag = {
            color: "CUSTOM", // Always use "CUSTOM" as color name for custom tags
            createdAt: new Date(),
            id: nanoid(),
            name: value,
            accountId,
            updatedAt: new Date(),
            colorHex: customColorHex
        };

        // Clear the input fields
        setValue("");
        setIsUsingCustomColor(false);
        
        try {
            // We need to modify the tag data to fit the database schema
            // Since colorHex might not be in the schema, we'll store it in a different way
            const dbTagData = {
                ...tagData,
                // Store custom color hex in the color field
                color: `CUSTOM:${customColorHex}`
            };
            
            // Save to backend first to get the correct ID
            const response = await upsertContactTag(accountId, dbTagData);
            console.log('Custom contact tag created:', response);
            toast.success('Contact Tag created.');

            // Add the newly created tag to the UI with the colorHex property
            const newTag = {...response, colorHex: customColorHex};
            setContactTags(prevTags => [...prevTags, newTag]);
            
            // Add the newly created tag to the selected tags
            handleAddSelections(newTag);

            await saveActivityLogNotification(accountId, `Added a contact tag | ${response.name}`);
        } catch (error) {
            console.error('Error creating custom tag:', error);
            toast('Oops...', {description: 'Something went wrong while creating the contact tag.'});
        }
    };

    const handleAddSelections = (contactTag: ExtendedContactTag) => {
        console.log('Adding contact tag to selections:', contactTag);
        if (selectedContactTags.every((t) => t.id !== contactTag.id)) {
            setSelectedContactTags([...selectedContactTags, contactTag]);
        }
    };
    
    const handleDeleteContactTag = async (contactTagId: string) => {
        setContactTags(contactTags.filter((tag) => tag.id !== contactTagId));
        try {
            const response = await deleteContactTag(contactTagId);
            toast.success('Contact tag has been deleted.');

            await saveActivityLogNotification(accountId, `Deleted a contact tag | ${response.name}`);

            router.refresh();
        } catch (error) {
            toast.error('Oops...', {description: 'Something went wrong while deleting the contact tag.'});
        }
    };

    // We've moved the tag processing logic to the fetch useEffect

    // Toggle the color picker
    const toggleCustomColor = () => {
        setIsUsingCustomColor(true);
    };

    return (
        <AlertDialog>
            <Command className="bg-transparent">
                {!!selectedContactTags.length && (
                    <div className="flex flex-wrap gap-2 p-2 bg-background border-none">
                        {selectedContactTags.map((tag) => (
                            <div key={tag.id} className="flex items-center">
                                <ContactTagComponent 
                                    title={tag.name} 
                                    colorName={tag.color} 
                                    colorHex={tag.colorHex}
                                />
                                <X size={14} className="text-muted-foreground cursor-pointer" onClick={() => handleDeleteSelection(tag.id)} />
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Predefined tags section */}
                <div className="flex items-center gap-2 my-2">
                    <ContactTagComponent 
                        key={'CLIENT'} 
                        title="Client" 
                        colorName={TagColors.at(0) ?? ''} 
                        onClick={() => handleAddPredefinedTag("Client", TagColors.at(0) ?? '')}
                    />
                    <ContactTagComponent 
                        key={'PROSPECT'} 
                        title="Prospect" 
                        colorName={TagColors.at(1) ?? ''} 
                        onClick={() => handleAddPredefinedTag("Prospect", TagColors.at(1) ?? '')}
                    />
                    <ContactTagComponent 
                        key={'PARTNER'} 
                        title="Partner" 
                        colorName={TagColors.at(2) ?? ''} 
                        onClick={() => handleAddPredefinedTag("Partner", TagColors.at(2) ?? '')}
                    />
                    <ContactTagComponent 
                        key={'VENDOR'} 
                        title="Vendor" 
                        colorName={TagColors.at(3) ?? ''} 
                        onClick={() => handleAddPredefinedTag("Vendor", TagColors.at(3) ?? '')}
                    />
                    <ContactTagComponent 
                        key={'PEER'} 
                        title="Peer" 
                        colorName={TagColors.at(4) ?? ''} 
                        onClick={() => handleAddPredefinedTag("Peer", TagColors.at(4) ?? '')}
                    />
                </div>
                
                {/* Custom tag creation section */}
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <CommandInput placeholder="Enter custom tag name..." value={value} onValueChange={setValue} />
                        </div>

                        <div className="flex items-center gap-2">
                            {!isUsingCustomColor ? (
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="default"
                                        size="sm" 
                                        onClick={toggleCustomColor}
                                        className="text-xs"
                                    >
                                        Choose Color
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                <div 
                                                    className="w-4 h-4 rounded-full" 
                                                    style={{ backgroundColor: customColorHex }}
                                                />
                                                <span className="text-xs">Color</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <HexColorPicker color={customColorHex} onChange={setCustomColorHex} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                            
                            <PlusCircleIcon 
                                onClick={handleAddContactTag} 
                                size={20} 
                                className="hover:text-primary transition-all cursor-pointer text-muted-foreground" 
                            />
                        </div>
                    </div>
                    
                    {/* Preview of the tag being created */}
                    {value && isUsingCustomColor && (
                        <div className="flex items-center gap-2 p-2 border border-dashed rounded-md">
                            <span className="text-xs text-muted-foreground">Preview:</span>
                            <ContactTagComponent 
                                title={value} 
                                colorName="CUSTOM" 
                                colorHex={customColorHex}
                            />
                        </div>
                    )}
                </div>
                
                {/* Existing tags list */}
                <CommandList>
                    <CommandSeparator />
                    <CommandGroup heading="Tags">
                        {contactTags.map((tag) => (
                            <CommandItem key={tag.id} className="hover:!bg-secondary !bg-transparent flex items-center justify-between !font-light cursor-pointer">
                                <div onClick={() => handleAddSelections(tag)}>
                                    <ContactTagComponent 
                                        title={tag.name} 
                                        colorName={tag.color} 
                                        colorHex={tag.colorHex}
                                    />
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
                                        <AlertDialogAction className="bg-destructive" onClick={() => handleDeleteContactTag(tag.id)}>
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

export default ContactTagCreator;