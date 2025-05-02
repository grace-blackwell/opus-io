"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Contact, ContactTag } from '@prisma/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DeleteButton from './delete-button'
import EditContactButton from './edit-contact-button'
import ContactTagDisplay from '@/components/global/contact-tag-display'
import ContactTagComponent from '@/components/global/contact-tag'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {Mail, Phone, Globe, MapPin, Filter, X, List, SquareUserRound} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type ContactWithTags = Contact & {
  ContactTags: ContactTag[]
  BillingAddress?: {
    id: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  } | null
}

type ContactsViewProps = {
  contacts: ContactWithTags[]
  accountId: string
  user: any
}

const ContactsView = ({ contacts, accountId, user }: ContactsViewProps) => {
  const [activeTab, setActiveTab] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Extract all unique tags from contacts
  const allTags = useMemo(() => {
    // Use a Map with tag.id as the key to ensure uniqueness
    const tagsMap = new Map<string, ContactTag>()
    contacts.forEach(contact => {
      contact.ContactTags.forEach(tag => {
        // Only add the tag if it's not already in the map
        if (!tagsMap.has(tag.id)) {
          tagsMap.set(tag.id, tag)
        }
      })
    })
    return Array.from(tagsMap.values())
  }, [contacts])
  
  // Filter contacts based on search query and selected tags
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filter by search query
      const matchesSearch = 
        searchQuery === '' || 
        contact.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.contactEmail && contact.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.contactPhone && contact.contactPhone.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Filter by selected tags
      const matchesTags = 
        selectedTags.length === 0 || 
        contact.ContactTags.some(tag => selectedTags.includes(tag.id))
      
      return matchesSearch && matchesTags
    })
  }, [contacts, searchQuery, selectedTags])
  
  // Handle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    )
  }
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  return (
    <AlertDialog>
      <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList className={'bg-background rounded-none'}>
            <TabsTrigger value="list"> <List className={'text-primary'}/> List View</TabsTrigger>
            <TabsTrigger value="card"> <SquareUserRound className={'text-primary'}/> Card View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {/* Filter by tags */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center gap-1 rounded-none">
                  <Filter className="h-4 w-4" />
                  Filter by Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-50">
                <div className="space-y-4">
                  <div className="space-y-2">
                    {allTags.length > 0 ? (
                      allTags.map(tag => {
                        const isCustomColor = tag.color.startsWith('CUSTOM:');
                        const colorHex = isCustomColor ? tag.color.split(':')[1] : undefined;
                        const colorName = isCustomColor ? 'CUSTOM' : tag.color;
                        
                        return (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`tag-${tag.id}`} 
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => toggleTag(tag.id)}
                            />
                            <Label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2 cursor-pointer">
                              <ContactTagDisplay
                                title={tag.name}
                                colorName={colorName}
                                colorHex={colorHex}
                              />
                            </Label>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    )}
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => setSelectedTags([])}
                    >
                      <X className="h-4 w-4" />
                      Clear Tag Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Clear all filters button */}
            {(searchQuery || selectedTags.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="list" className="w-full">
          {/* List View */}
          <Command className='bg-transparent max-w-6xl shadow-sm'>
            <CommandInput 
              placeholder='Search Contacts...' 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No contacts found.</CommandEmpty>
              <CommandGroup heading={`Contacts (${filteredContacts.length})`}>
                {filteredContacts.length > 0
                  ? (filteredContacts.map((contact) => (
                    <CommandItem key={contact.id} className='max-w-3xl h-auto min-h-20 my-2 text-primary border-[1px] p-4 cursor-pointer'>
                      <Link href={`/account/${accountId}/contacts/${contact.id}`} className='flex gap-4 w-full h-full'>
                        <div className='flex flex-col justify-between w-full'>
                          <div className='flex flex-col'>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground">{contact.contactName}</span>
                              <div className="flex gap-1">
                                {contact.ContactTags.map(tag => {
                                  // Check if the color is a custom color (starts with CUSTOM:)
                                  const isCustomColor = tag.color.startsWith('CUSTOM:');
                                  const colorHex = isCustomColor ? tag.color.split(':')[1] : undefined;
                                  const colorName = isCustomColor ? 'CUSTOM' : tag.color;
                                  
                                  return (
                                    <ContactTagDisplay
                                      key={tag.id}
                                      title={tag.name}
                                      colorName={colorName} 
                                      colorHex={colorHex}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            <span className='text-xs'>
                              {contact.contactEmail}
                            </span>
                            {contact.contactPhone && (
                              <span className='text-xs'>
                                {contact.contactPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <EditContactButton 
                          user={user} 
                          contactId={contact.id}
                        />
                        <AlertDialogTrigger asChild>
                          <Button size={'sm'} variant={'destructive'} className='text-black bg-red-600/50 w-20 hover:bg-red-600 hover:text-white'>
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                      </div>
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
        </TabsContent>
        
        <TabsContent value="card" className="w-full">
          {/* Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <Card key={contact.id} className="overflow-hidden bg-muted border-none rounded-none">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Link href={`/account/${accountId}/contacts/${contact.id}`} className="hover:underline">
                        <CardTitle className="text-xl">{contact.contactName}</CardTitle>
                      </Link>
                      <div className="flex gap-2">
                        <EditContactButton 
                          user={user} 
                          contactId={contact.id}
                          size="sm"
                        />
                        <AlertDialogTrigger asChild>
                          <Button size={'sm'} variant={'destructive'} className='text-black bg-red-600/50 w-20 hover:bg-red-600 hover:text-white'>
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.ContactTags.map(tag => {
                        const isCustomColor = tag.color.startsWith('CUSTOM:');
                        const colorHex = isCustomColor ? tag.color.split(':')[1] : undefined;
                        const colorName = isCustomColor ? 'CUSTOM' : tag.color;
                        
                        return (
                          <ContactTagDisplay
                            key={tag.id}
                            title={tag.name}
                            colorName={colorName} 
                            colorHex={colorHex}
                          />
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contact.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-sm">{contact.contactEmail}</span>
                        </div>
                      )}
                      {contact.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="text-sm">{contact.contactPhone}</span>
                        </div>
                      )}
                      {contact.contactWebsite && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-sm">{contact.contactWebsite}</span>
                        </div>
                      )}
                      
                      {contact.BillingAddress && (
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Billing Address
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            <p>{contact.BillingAddress.street}</p>
                            <p>
                              {contact.BillingAddress.city}, {contact.BillingAddress.state} {contact.BillingAddress.zipCode}
                            </p>
                            <p>{contact.BillingAddress.country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
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
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground p-8">
                No contacts found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AlertDialog>
  )
}

export default ContactsView