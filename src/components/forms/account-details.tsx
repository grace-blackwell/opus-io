'use client'

import React, {useEffect, useState} from 'react'
import {Account} from "@prisma/client"
import {toast} from "sonner"
import {useRouter} from "next/navigation";
import {
    AlertDialog, AlertDialogTrigger,
    AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription,
    AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {deleteAccount, createOrUpdateAccount, updateOrCreateUser, updateAccountDetails} from "@/lib/queries";
import {States} from "@/lib/constants";
import {useForm} from "react-hook-form";
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from "zod"
import FileUpload from "../global/file-upload";
import {Button} from "@/components/ui/button";
import Loading from "@/components/global/loading";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Check, ChevronsUpDown} from "lucide-react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {nanoid} from "nanoid";

type Props = {
    data?: Partial<Account>
}

const FormSchema = z.object({
    accountName: z.string().min(1, {message: 'Name cannot be empty'}),
    accountEmail: z.string().min(1, {message: 'Email cannot be empty'}),
    title: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
    zipCode: z.string().min(5).max(9),
    country: z.string().min(3),
    logo: z.string().optional()
})

const AccountDetails = ({data}: Props) => {
    const router = useRouter()
    const [deletingAccount, setDeletingAccount] = useState(false)
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(data?.state || "")

    const form = useForm<z.infer<typeof FormSchema>>({
        mode: 'onChange',
        resolver: zodResolver(FormSchema),
        defaultValues: {
            accountName: data?.accountName ?? '',
            accountEmail: data?.accountEmail ?? '',
            title: data?.title ?? '',
            address: data?.address ?? '',
            city: data?.city ?? '',
            state: data?.state ?? '',
            zipCode: data?.zipCode ?? '',
            country: data?.country ?? '',
            logo: data?.logo ?? ''
        },
    })

    const isLoading = form.formState.isSubmitting

    useEffect(() => {
        if (data){
            form.reset(data)
            setValue(data.state || "")
        }
    },[data])

    const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
        try {
            if (!data?.id) {
                const body = {
                    accountName: values.accountName,
                    accountEmail: values.accountEmail,
                    shipping: {
                        address: {
                            city: values.city,
                            country: values.country,
                            line1: values.address,
                            postal_code: values.zipCode,
                            state: values.state
                        }
                    },
                    address: {
                        city: values.city,
                        country: values.country,
                        line1: values.address,
                        postal_code: values.zipCode,
                        state: values.state
                    }
                }
            }


            const currentFormValues = form.getValues();
            console.log("Current form values before creating account data:", currentFormValues);

            const accountData = {
                id: data?.id ? data.id : nanoid(),
                accountName: currentFormValues.accountName || '',
                accountEmail: currentFormValues.accountEmail || '',
                title: currentFormValues.title || '',
                connectedAccountId: '',
                logo: currentFormValues.logo || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: '',
                address: currentFormValues.address || '',
                city: currentFormValues.city || '',
                state: currentFormValues.state || '',
                country: currentFormValues.country || '',
                zipCode: currentFormValues.zipCode || ''
            };
            
            console.log("Attempting to create/update account with data:", {
                id: accountData.id,
                accountName: accountData.accountName,
                accountEmail: accountData.accountEmail,
                userId: accountData.userId
            });
            
            await updateOrCreateUser()
            const response = await createOrUpdateAccount(accountData);
            
            if (!response) {
                console.log("Account upsert returned null");
                toast.error('Account Error', {
                    description: 'Failed to save account details. Please check your information and try again.'
                });
                return;
            }
            
            toast.success('Account Created', {
                description: 'Account created successfully'
            });
            
            return router.refresh();
        } catch (e) {
            console.log(e);

            toast.error('Oops...', {
                description: 'Something went wrong while ' + (data?.id ? 'updating' : 'creating') + ' your account.'
            });
        }
    }

    const handleDeleteAccount = async () => {
        if (!data?.id) return;
        setDeletingAccount(true);
        //TODO: discontinue subscription
        try{
            const response = await deleteAccount(data.id)
            toast.success('Account deleted successfully', {
                description: 'Account deleted on ' + new Date()
            });
            router.refresh()
        } catch (error) {
            console.log(error)
            toast.error('Oops...', {
                description: 'Something went wrong while deleting your account.'
            })
            setDeletingAccount(false)
        }
    }

    return(
        <AlertDialog>
            <Card className='w-full border-none rounded-none'>
                <CardHeader>
                    <CardTitle className="text-foreground">Account Information</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        <p className='text-muted-foreground'> (*) indicates a required field.</p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                // Get all form values directly
                                const formValues = form.getValues();
                                console.log("Direct form values:", formValues);

                                form.trigger().then(isValid => {
                                    if (isValid) {
                                        handleSubmit(formValues);
                                    } else {
                                        console.error("Form validation failed");
                                        toast.error('Validation Error', {
                                            description: 'Please check the form for errors and try again.'
                                        });
                                    }
                                });
                            }}
                            className='space-y-2 w-full'>
                            <FormField disabled={isLoading} control={form.control} name="logo"
                                       render={({field}) => (
                                           <FormItem>
                                               <FormLabel>Profile Photo or Logo</FormLabel>
                                               <FormDescription className="text-muted-foreground">Upload your logo or a
                                                   photo of yourself.</FormDescription>
                                               <FormControl>
                                                   <FileUpload
                                                       apiEndpoint='logo'
                                                       onChange={field.onChange}
                                                       value={field.value}
                                                   />
                                               </FormControl>
                                               <FormMessage/>
                                           </FormItem>
                                       )}
                            />
                            <div className='flex flex-col md:flex-row gap-4 mt-6'>
                                <FormField disabled={isLoading} control={form.control} name="accountName"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* Full Name or Business Name</FormLabel>
                                           <FormControl>
                                               <Input placeholder='Your Name or Business Name' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>

                                <FormField disabled={isLoading} control={form.control} name="accountEmail"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* Email</FormLabel>
                                           <FormControl>
                                               <Input placeholder='Your Email Address' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>
                            </div>

                            <div className='flex flex-col md:flex-row gap-4 mt-4'>
                            <FormField disabled={isLoading} control={form.control} name="title"
                               render={({field}) => (
                                   <FormItem className="flex-1">
                                       <FormLabel>* Title</FormLabel>
                                       <FormControl>
                                           <Input placeholder='What do you do?' {...field}/>
                                       </FormControl>
                                       <FormMessage/>
                                   </FormItem>
                               )}></FormField>
                            </div>

                            <div className='flex flex-col md:flex-row gap-4 mt-4'>
                                <FormField disabled={isLoading} control={form.control} name="address"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* Street</FormLabel>
                                           <FormControl>
                                               <Input placeholder='Street Address' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>
                            </div>

                            <div className='flex flex-col md:flex-row gap-4 mt-4'>
                                <FormField disabled={isLoading} control={form.control} name="city"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* City</FormLabel>
                                           <FormControl>
                                               <Input placeholder='City' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>

                                <FormField disabled={isLoading} control={form.control} name="state"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* State</FormLabel>
                                           <FormControl>
                                               <Popover open={open} onOpenChange={setOpen}>
                                                   <PopoverTrigger asChild className='text-left'>
                                                       <Button variant='outline' role='combobox' aria-expanded={open} className='bg-input text-muted-foreground border-none justify-between'>
                                                       {field.value ? States.find((state) => state.value === field.value)?.label : 'State...'}
                                                       <ChevronsUpDown className='opacity-50' />
                                                       </Button>
                                                   </PopoverTrigger>
                                                   <PopoverContent className='p-0 bg-input text-foreground'>
                                                       <Command>
                                                           <CommandInput
                                                               defaultValue={data?.state}
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
                                                                               // Update the form field value
                                                                               field.onChange(newValue);
                                                                               updateAccountDetails(data?.id ?? '', {state: newValue});
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

                                <FormField disabled={isLoading} control={form.control} name="zipCode"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>* Zip Code</FormLabel>
                                           <FormControl>
                                               <Input placeholder='Zip Code' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>
                            </div>

                            <div className='flex flex-col md:flex-row gap-4 mt-4 pb-6'>
                                <FormField disabled={isLoading} control={form.control} name="country"
                                   render={({field}) => (
                                       <FormItem className="flex-1">
                                           <FormLabel>Country</FormLabel>
                                           <FormControl>
                                               <Input placeholder='Country' {...field}/>
                                           </FormControl>
                                           <FormMessage/>
                                       </FormItem>
                                   )}></FormField>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loading/> : 'Save Account Details'}
                            </Button>

                        </form>
                    </Form>

                    {data?.id && (
                        <div
                            className='flex flex-row items-center justify-between rounded-lg border border-destructive gap-4 p-4 mt-4'>
                            <div>
                                <div>Warning</div>
                            </div>
                            <div className='text-muted-foreground'>
                                Deleting your account cannot be undone. This will permanently delete all of your data.
                            </div>
                            <AlertDialogTrigger
                                className='text-red-600 p-2 text-center mt-2 rounded-md hover:bg-red-600 hover:text-white whitespace-nowrap'>
                                {deletingAccount ? 'Deleting...': 'Delete Account'}
                            </AlertDialogTrigger>
                        </div>
                    )}
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className='text-left'>
                                Are you sure you want to delete your account?
                            </AlertDialogTitle>
                            <AlertDialogDescription className='text-left'>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className='flex items-center'>
                            <AlertDialogCancel className='mb-2'>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={deletingAccount}
                                className='bg-destructive hover:bg-destructive'
                                onClick={handleDeleteAccount}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </CardContent>
            </Card>
    </AlertDialog>
    )
}

export default AccountDetails