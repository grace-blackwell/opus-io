"use client"

import React, { useState } from 'react'
import { Contact, ContactTag } from '@prisma/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DeleteButton from './delete-button'
import EditContactButton from './edit-contact-button'
import ContactTagDisplay from '@/components/global/contact-tag-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Globe, MapPin } from 'lucide-react'

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

  return (
    <AlertDialog>
      <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="card">Card View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="w-full">
          {/* List View */}
          <Command className='rounded-lg bg-transparent max-w-6xl shadow-sm'>
            <CommandInput placeholder='Search Contacts...' className=''/>
            <CommandList>
              <CommandEmpty>No contacts found.</CommandEmpty>
              <CommandGroup heading="Contacts">
                {contacts.length > 0
                  ? (contacts.map((contact) => (
                    <CommandItem key={contact.id} className='max-w-3xl h-auto min-h-20 my-2 text-primary border-[1px] p-4 rounded-lg cursor-pointer'>
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
                          <Button size={'sm'} variant={'destructive'} className='text-red-600 bg-white w-20 hover:bg-red-600 hover:text-white'>
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
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <Card key={contact.id} className="overflow-hidden">
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
                          <Button size="sm" variant="destructive">
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
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contact.contactEmail}</span>
                        </div>
                      )}
                      {contact.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contact.contactPhone}</span>
                        </div>
                      )}
                      {contact.contactWebsite && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contact.contactWebsite}</span>
                        </div>
                      )}
                      
                      {contact.BillingAddress && (
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
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