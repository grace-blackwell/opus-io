'use client'

import React, {useEffect, useState} from 'react'
import {Account, BillingAddress, Contact, ContactTag} from "@prisma/client"
import {toast} from "sonner"
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {
    createOrUpdateContact,
    saveActivityLogNotification,
} from "@/lib/queries";
import {useForm} from "react-hook-form";
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from "zod"
import {Button} from "@/components/ui/button";
import {useModal} from "@/providers/modal-provider";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import ContactTagCreator from "@/components/global/contact-tag-creator";
import {States} from "@/lib/constants";
import {Check, ChevronsUpDown} from "lucide-react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {nanoid} from "nanoid";

const customInputStyles = {
    background: 'var(--input)',
    border: 'none',
    color: 'var(--foreground)'
};

type ContactWithRelations = Contact & {
    BillingAddress?: BillingAddress | null;
    ContactTags?: ContactTag[];
}

type Props = {
    accountData?: Account,
    data?: Partial<ContactWithRelations>
}

const FormSchema = z.object({
    contactName: z.string(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    contactWebsite: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
})

const ContactDetails: React.FC<Props> = ({accountData, data}) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [selectedTags, setSelectedTags] = useState<ContactTag[]>([])
    const {setClose} = useModal()
    const router = useRouter()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            contactName: data?.contactName ?? '',
            contactEmail: data?.contactEmail ?? '',
            contactPhone: data?.contactPhone ?? '',
            contactWebsite: data?.contactWebsite ?? '',
            street: '',
            city:'',
            state:'',
            zipCode:'',
            country:''
        },
    })

    // Load tags if editing an existing contact
    useEffect(() => {
        const loadTags = async () => {
            if (data?.id && accountData?.id) {
                try {
                    console.log('Loading tags for contact:', data.id);
                    // Fetch the contact with its tags
                    const contactWithTags = await fetch(`/api/contacts/${data.id}`).then(res => res.json());
                    
                    if (contactWithTags && contactWithTags.ContactTags) {
                        console.log('Contact with tags response:', contactWithTags);
                        
                        // Process the tags to handle custom colors
                        const processedTags = contactWithTags.ContactTags.map(tag => {
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
                        
                        console.log('Setting selected contact tags:', processedTags);
                        setSelectedTags(processedTags);
                    }
                } catch (error) {
                    console.error("Error loading tags:", error);
                }
            }
        };
        
        loadTags();
    }, [data?.id, accountData?.id]);

    async function onSubmit(values: z.infer<typeof FormSchema>){
        try {
            const billingAddress = {
                id: data?.BillingAddress?.id || nanoid(),
                street: values.street || '',
                city: values.city || '',
                state: values.state || '',
                zipCode: values.zipCode || '',
                country: values.country || '',
            }

            console.log('Submitting contact with selected tags:', selectedTags);
            
            const response = await createOrUpdateContact({
                id: data?.id ? data.id : nanoid(),
                contactName: values.contactName,
                contactEmail: values.contactEmail ? values.contactEmail : '',
                contactPhone: values.contactPhone ? values.contactPhone : '',
                contactWebsite: values.contactWebsite ? values.contactWebsite : '',
                createdAt: new Date(),
                updatedAt: new Date(),
                accountId: accountData?.id ?? '',
            },
                accountData!,
                billingAddress,
                selectedTags
            )

            if(!response) throw new Error('Failed to create contact')

            const isNewContact = !data?.id;
            const actionText = isNewContact ? 'added' : 'updated';
            
            await saveActivityLogNotification(
                accountData?.id ?? "", 
                `Contact ${actionText}: ${values.contactName}`
            )

            toast.success(`Successfully ${isNewContact ? 'created a new' : 'updated'} contact`, {
                description: `${values.contactName}`
            })

            setClose();
            router.refresh();

        } catch (e) {
            console.log(e);
            const isNewContact = !data?.id;
            toast.error('Oops...', {
                description: `Something went wrong while ${isNewContact ? 'adding' : 'updating'} the Contact.`
            });
        }
    }

    useEffect(() => {
        console.log('ContactDetails data:', data);
        if (data) {
            console.log('Resetting form with data:', {
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                contactWebsite: data.contactWebsite,
                BillingAddress: data.BillingAddress
            });
            
            form.reset({
                contactName: data.contactName || '',
                contactEmail: data.contactEmail || '',
                contactPhone: data.contactPhone || '',
                contactWebsite: data.contactWebsite || '',
            });
            
            // If we have billing address data, populate those fields too
            if (data.BillingAddress) {
                console.log('Setting billing address fields:', data.BillingAddress);
                form.setValue('street', data.BillingAddress.street || '');
                form.setValue('city', data.BillingAddress.city || '');
                form.setValue('state', data.BillingAddress.state || '');
                form.setValue('zipCode', data.BillingAddress.zipCode || '');
                form.setValue('country', data.BillingAddress.country || '');
            }
        }
    }, [data, form]);

    const isLoading = form.formState.isSubmitting;

    return(
        <Card className='w-full bg-base-100'>
            <CardHeader className={'text-base-content'}>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                    Please enter contact details.
                </CardDescription>
            </CardHeader>
            <CardContent className={'text-base-content'}>
                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formValues = form.getValues();

                            form.trigger().then(isValid => {
                                if (isValid) {
                                    onSubmit(formValues);
                                } else {
                                    console.error("Form validation failed");
                                    toast.error('Validation Error', {
                                        description: 'Please check the form for errors and try again.'
                                    });
                                }
                            });
                        }}
                        className='space-y-4 w-full'>

                        <div className='flex md:flex-row gap-4'>
                            <FormField disabled={isLoading} control={form.control} name="contactName"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>* Contact Name</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='Contact or Business Name' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>

                            <FormField disabled={isLoading} control={form.control} name="contactEmail"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Contact Email</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles} type="email"
                                                          placeholder='Contact Email Address' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>

                            <FormField disabled={isLoading} control={form.control} name="contactPhone"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Contact Phone</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='Contact Phone Number' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>
                        </div>

                        <div className='flex md:flex-row gap-4'>
                            <FormField disabled={isLoading} control={form.control} name="contactWebsite"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Contact Website</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='Contact Website URL' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>
                        </div>

                        <div className="space-y-2">
                            <FormLabel>Tags</FormLabel>
                            <ContactTagCreator 
                                accountId={accountData?.id || ''} 
                                getSelectedContactTags={setSelectedTags}
                                defaultTags={selectedTags}
                            />
                        </div>

                        <h3>Billing Information</h3>

                        <div className='flex md:flex-row gap-4'>
                            <FormField disabled={isLoading} control={form.control} name="street"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Street</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='street address' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>

                            <FormField disabled={isLoading} control={form.control} name="city"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>City</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='city' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>

                            <FormField disabled={isLoading} control={form.control} name="state"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>State</FormLabel>
                                               <FormControl>
                                                   <Popover open={open} onOpenChange={setOpen}>
                                                       <PopoverTrigger asChild className='text-left'>
                                                           <Button variant='ghost' role='combobox' aria-expanded={open} className='justify-between'>
                                                               {field.value ? States.find((state) => state.value === field.value)?.label : 'State...'}
                                                               <ChevronsUpDown className='opacity-50' />
                                                           </Button>
                                                       </PopoverTrigger>
                                                       <PopoverContent className='p-0'>
                                                           <Command>
                                                               <CommandInput
                                                                   placeholder='Search...'
                                                               />
                                                               <CommandList>
                                                                   <CommandEmpty>State/Territory not found.</CommandEmpty>
                                                                   <CommandGroup>
                                                                       {States.map((state) => (
                                                                           <CommandItem
                                                                               key={state.value}
                                                                               value={state.value}
                                                                               onSelect={ (currentValue) => {
                                                                                   const newValue = currentValue === value ? '' : currentValue;
                                                                                   setValue(newValue);
                                                                                   field.onChange(newValue);
                                                                                   setOpen(false);
                                                                               }}>
                                                                               {state.label}
                                                                               <Check className={cn('ml-auto', field.value === state.value ? 'opacity-100' : 'opacity-0')} />
                                                                           </CommandItem>
                                                                       ) )}
                                                                   </CommandGroup>
                                                               </CommandList>
                                                           </Command>
                                                       </PopoverContent>
                                                   </Popover>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>
                        </div>

                        <div className='flex md:flex-row gap-4'>
                            <FormField disabled={isLoading} control={form.control} name="zipCode"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Zip Code</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='zip code' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>

                            <FormField disabled={isLoading} control={form.control} name="country"
                                       render={({field}) => (
                                           <FormItem className="flex-1">
                                               <FormLabel>Country</FormLabel>
                                               <FormControl>
                                                   <Input style={customInputStyles}
                                                          placeholder='country' {...field}/>
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}></FormField>
                        </div>



                        <div className='flex justify-end'>
                            <Button type='submit' disabled={isLoading}>
                                {isLoading ? 'Saving...' : data?.id ? 'Update Contact' : 'Save Contact'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default ContactDetails