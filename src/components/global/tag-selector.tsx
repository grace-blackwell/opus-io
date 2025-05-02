'use client'

import React, { useEffect, useState } from 'react'
import { Tag } from '@prisma/client'
import { getTagsForAccount, upsertTag } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, Plus, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'

type Props = {
    accountId: string
    onTagsSelected: (tags: Tag[]) => void
    initialTags?: Tag[]
}

const TagSelector = ({ accountId, onTagsSelected, initialTags = [] }: Props) => {
    const [tags, setTags] = useState<Tag[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags)
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState('#3b82f6') // Default blue color
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const fetchTags = async () => {
            if (accountId) {
                const response = await getTagsForAccount(accountId)
                if (response?.Tags) {
                    setTags(response.Tags)
                }
            }
        }
        
        fetchTags()
    }, [accountId])

    useEffect(() => {
        // Update parent component when selected tags change
        onTagsSelected(selectedTags)
    }, [selectedTags, onTagsSelected])

    const handleTagSelect = (tag: Tag) => {
        const isSelected = selectedTags.some(t => t.id === tag.id)
        
        if (isSelected) {
            setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
        } else {
            setSelectedTags([...selectedTags, tag])
        }
    }

    const handleCreateTag = async () => {
        if (!newTagName.trim()) {
            toast.error('Tag name cannot be empty')
            return
        }

        try {
            const newTag: Tag = {
                id: nanoid(),
                name: newTagName.trim(),
                color: newTagColor,
                accountId,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const createdTag = await upsertTag(accountId, newTag)
            
            if (createdTag) {
                setTags([...tags, createdTag])
                setSelectedTags([...selectedTags, createdTag])
                setNewTagName('')
                toast.success('Tag created successfully')
            }
        } catch (error) {
            console.error('Error creating tag:', error)
            toast.error('Failed to create tag')
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                    <Badge 
                        key={tag.id} 
                        style={{ backgroundColor: tag.color }}
                        className="flex items-center gap-1 px-3 py-1"
                    >
                        {tag.name}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleTagSelect(tag)}
                        />
                    </Badge>
                ))}
                
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 gap-1 text-xs"
                        >
                            <Plus className="h-3 w-3" />
                            Add Tag
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-4">
                            <h4 className="font-medium">Select Tags</h4>
                            
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {tags.map(tag => (
                                    <div 
                                        key={tag.id}
                                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                        onClick={() => handleTagSelect(tag)}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span>{tag.name}</span>
                                        {selectedTags.some(t => t.id === tag.id) && (
                                            <Check className="h-4 w-4 ml-auto" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Create New Tag</h4>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Tag name"
                                        value={newTagName}
                                        onChange={e => setNewTagName(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="color"
                                        value={newTagColor}
                                        onChange={e => setNewTagColor(e.target.value)}
                                        className="w-12 p-1 h-10"
                                    />
                                </div>
                                <Button 
                                    onClick={handleCreateTag}
                                    className="w-full"
                                >
                                    Create Tag
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default TagSelector