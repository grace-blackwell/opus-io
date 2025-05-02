'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { format, addDays } from 'date-fns'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {Plus, Trash, FileText, Mail, Eye, Edit} from 'lucide-react'

// Custom components
import InvoicePdf from '@/app/(main)/account/[accountId]/invoices/_components/invoice-pdf'
import { createOrUpdateInvoice, saveActivityLogNotification } from '@/lib/queries'
import { emailInvoiceToContact } from '@/lib/invoice-utils'
import { Account, Contact } from '@prisma/client'

// Types
type InvoiceItem = {
    id: string
    description: string
    quantity: string
    unitPrice: string
    amount: string
}

type Props = {
    accountId: string
    accountDetails: Account
    contacts: Contact[]
}

const FormSchema = z.object({
    invoiceDate: z.string(),
    dueDate: z.string(),
    paymentStatus: z.string(),
    currency: z.string(),
    contactId: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactAddress: z.string().optional(),
    contactCity: z.string().optional(),
    contactState: z.string().optional(),
    contactZip: z.string().optional(),
    contactCountry: z.string().optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    salesTaxRate: z.string().optional(),
    salesTaxAmount: z.string().optional(),
    subtotal: z.string(),
    totalDue: z.string(),
})

const InvoiceGenerator: React.FC<Props> = ({ accountId, accountDetails, contacts }) => {
    const router = useRouter()
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: nanoid(), description: '', quantity: '1', unitPrice: '0', amount: '0' }
    ])
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [useExistingContact, setUseExistingContact] = useState(true)
    const [previewMode, setPreviewMode] = useState(false)
    const [invoiceData, setInvoiceData] = useState<any>(null)

    // Get today's date and due date (7 days from now) in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd')
    const dueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            invoiceDate: today,
            dueDate: dueDate,
            paymentStatus: 'Unpaid',
            currency: 'USD',
            contactId: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            contactAddress: '',
            contactCity: '',
            contactState: '',
            contactZip: '',
            contactCountry: '',
            notes: '',
            terms: 'Payment due within 30 days',
            salesTaxRate: '',
            salesTaxAmount: '',
            subtotal: '0',
            totalDue: '0',
        },
    })

    // Calculate subtotal, sales tax amount, and total due when items change
    useEffect(() => {
        const subtotal = items.reduce((sum, item) => {
            const itemAmount = parseFloat(item.amount) || 0
            return sum + itemAmount
        }, 0)

        form.setValue('subtotal', subtotal.toFixed(2))

        const salesTaxRate = parseFloat(form.watch('salesTaxRate') || '0')
        if (salesTaxRate) {
            const salesTaxAmount = subtotal * (salesTaxRate / 100)
            form.setValue('salesTaxAmount', salesTaxAmount.toFixed(2))
            form.setValue('totalDue', (subtotal + salesTaxAmount).toFixed(2))
        } else {
            form.setValue('salesTaxAmount', '0')
            form.setValue('totalDue', subtotal.toFixed(2))
        }
    }, [items, form.watch('salesTaxRate')])

    // Handle contact selection change
    const handleContactChange = (contactId: string) => {
        setSelectedContactId(contactId)
        form.setValue('contactId', contactId)

        // Find the selected contact
        const selectedContact = contacts.find(contact => contact.id === contactId)
        if (selectedContact) {
            // Populate contact fields
            form.setValue('contactName', selectedContact.contactName)
            form.setValue('contactEmail', selectedContact.contactEmail || '')
            form.setValue('contactPhone', selectedContact.contactPhone || '')
        }
    }

    // Add a new item row
    const addItem = () => {
        setItems([...items, { id: nanoid(), description: '', quantity: '1', unitPrice: '0', amount: '0' }])
    }

    // Remove an item row
    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id))
        } else {
            toast.error('You must have at least one item')
        }
    }

    // Update item values
    const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value }
                
                // Recalculate amount if quantity or unitPrice changes
                if (field === 'quantity' || field === 'unitPrice') {
                    const quantity = parseFloat(field === 'quantity' ? value : item.quantity) || 0
                    const unitPrice = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0
                    updatedItem.amount = (quantity * unitPrice).toFixed(2)
                }
                
                return updatedItem
            }
            return item
        })
        
        setItems(updatedItems)
    }

    // Generate preview data
    const generatePreview = async () => {
        const values = form.getValues()
        
        // Validate form
        const isValid = await form.trigger()
        if (!isValid) {
            toast.error('Please fill in all required fields')
            return
        }

        // Create invoice data for preview
        const previewData = {
            id: nanoid(),
            invoiceNumber: Date.now(), // Use timestamp as temporary invoice number
            invoiceDate: new Date(values.invoiceDate),
            dueDate: new Date(values.dueDate),
            paymentStatus: values.paymentStatus,
            currency: values.currency,
            unitType: 'Custom',
            unitPrice: parseFloat(items[0].unitPrice),
            quantity: parseInt(items[0].quantity),
            subtotal: parseFloat(values.subtotal),
            salesTaxRate: values.salesTaxRate ? parseFloat(values.salesTaxRate) : undefined,
            salesTaxAmount: values.salesTaxAmount ? parseFloat(values.salesTaxAmount) : undefined,
            totalDue: parseFloat(values.totalDue),
            Account: accountDetails,
            Contact: {
                id: values.contactId || nanoid(),
                contactName: values.contactName || 'Client',
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone,
                BillingAddress: values.contactAddress ? {
                    street: values.contactAddress,
                    city: values.contactCity || '',
                    state: values.contactState || '',
                    zipCode: values.contactZip || '',
                    country: values.contactCountry || '',
                } : null
            },
            Project: {
                projectTitle: items.map(item => item.description).join(', ').substring(0, 50),
                status: 'Completed'
            },
            items: items,
            notes: values.notes,
            terms: values.terms
        }

        setInvoiceData(previewData)
        setPreviewMode(true)
    }

    // Save invoice to database
    const saveInvoice = async () => {
        try {
            const values = form.getValues()
            
            // Validate form
            const isValid = await form.trigger()
            if (!isValid) {
                toast.error('Please fill in all required fields')
                return
            }

            // Create contact if using custom contact
            let contactId = values.contactId
            if (!useExistingContact && values.contactName) {
                // Check if we need to create a new contact
                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contactName: values.contactName,
                        contactEmail: values.contactEmail,
                        contactPhone: values.contactPhone,
                        accountId: accountId,
                        billingAddress: values.contactAddress ? {
                            street: values.contactAddress,
                            city: values.contactCity || '',
                            state: values.contactState || '',
                            zipCode: values.contactZip || '',
                            country: values.contactCountry || '',
                        } : null
                    }),
                })

                const data = await response.json()
                if (data.contact) {
                    contactId = data.contact.id
                }
            }

            // Create a simple project for this invoice
            const projectResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectTitle: `Invoice ${format(new Date(), 'yyyy-MM-dd')}`,
                    description: items.map(item => item.description).join(', ').substring(0, 100),
                    accountId: accountId,
                    contactId: contactId,
                    status: 'Completed'
                }),
            })

            const projectData = await projectResponse.json()
            if (!projectData.project) {
                throw new Error('Failed to create project')
            }

            // Create contract for this project (required for invoice)
            const contractResponse = await fetch('/api/contracts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractTitle: `Contract for Invoice ${format(new Date(), 'yyyy-MM-dd')}`,
                    dateOfAgreement: new Date(),
                    expirationDate: new Date(values.dueDate),
                    paymentTerms: values.terms || 'Payment due within 30 days',
                    paymentFrequency: 'One-time',
                    accountId: accountId,
                    contactId: contactId,
                    projectId: projectData.project.id
                }),
            })

            const contractData = await contractResponse.json()
            if (!contractData.contract) {
                throw new Error('Failed to create contract')
            }

            // Create invoice
            const invoiceData = {
                id: nanoid(),
                invoiceDate: values.invoiceDate,
                dueDate: values.dueDate,
                paymentStatus: values.paymentStatus,
                currency: values.currency,
                unitType: 'Custom',
                unitPrice: parseFloat(items[0].unitPrice),
                quantity: parseInt(items[0].quantity),
                subtotal: parseFloat(values.subtotal),
                salesTaxRate: values.salesTaxRate ? parseFloat(values.salesTaxRate) : 0,
                salesTaxAmount: values.salesTaxAmount ? parseFloat(values.salesTaxAmount) : 0,
                totalDue: parseFloat(values.totalDue),
                contactId: contactId,
                projectId: projectData.project.id,
                contractId: contractData.contract.id
            }

            const response = await createOrUpdateInvoice(invoiceData, accountId)

            if (!response) throw new Error('Failed to create invoice')

            await saveActivityLogNotification(
                accountId, 
                `Created new invoice: #${response.invoiceNumber.toString()}`
            )

            toast.success(`Successfully created invoice`, {
                description: `Invoice #${response.invoiceNumber.toString()}`
            })

            // Redirect to invoices page
            router.push(`/account/${accountId}/invoices`)

        } catch (e) {
            console.error(e)
            toast.error('Oops...', {
                description: 'Something went wrong while saving the invoice.'
            })
        }
    }

    // Send invoice via email
    const sendInvoice = async () => {
        if (!invoiceData) {
            toast.error('Please generate a preview first')
            return
        }

        if (!invoiceData.Contact?.contactEmail) {
            toast.error('Contact email address is required')
            return
        }

        toast.info('Sending Email...', {
            description: `Preparing to send invoice to ${invoiceData.Contact.contactEmail}.`
        })

        try {
            // Use the server action to send the email
            const result = await emailInvoiceToContact(invoiceData)
            
            if (result.success) {
                toast.success('Email Sent', {
                    description: `Invoice has been sent to ${invoiceData.Contact.contactEmail}.`
                })
            } else {
                toast.error('Email Not Sent', {
                    description: result.message
                })
            }
        } catch (error) {
            console.error('Error sending email:', error)
            toast.error('Email Not Sent', {
                description: 'An unexpected error occurred while sending the email.'
            })
        }
    }

    return (
        <Tabs defaultValue={previewMode ? "preview" : "edit"} className="w-full items-center">
            <TabsList className="mb-4 rounded-none bg-background">
                <TabsTrigger
                    value="edit"
                    onClick={() => setPreviewMode(false)}
                >
                    <Edit/> Edit
                </TabsTrigger>
                <TabsTrigger
                    value="preview"
                    onClick={generatePreview}
                >
                    <FileText /> PDF Preview
                </TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
                <Form {...form}>
                    <form className="space-y-6 w-full text-foreground bg-background p-6 border shadow-xl">
                        {/* Invoice Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Invoice Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="invoiceDate"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>* Invoice Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className="bg-input border-none text-muted-foreground"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>* Due Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className="bg-input border-none text-muted-foreground"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>* Currency</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="bg-input border-none text-muted-foreground">
                                                        <SelectValue placeholder="Select currency"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Client Information Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Client Information</h3>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setUseExistingContact(true)}
                                        className={useExistingContact ? "bg-primary text-primary-foreground rounded-none" : "rounded-none"}
                                    >
                                        Existing Client
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setUseExistingContact(false)}
                                        className={!useExistingContact ? "bg-primary text-primary-foreground rounded-none" : "rounded-none"}
                                    >
                                        New Client
                                    </Button>
                                </div>
                            </div>

                            {useExistingContact ? (
                                <FormField
                                    control={form.control}
                                    name="contactId"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>* Client</FormLabel>
                                            <Select
                                                onValueChange={(value) => handleContactChange(value)}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="bg-input border-none text-muted-foreground">
                                                        <SelectValue placeholder="Select a client"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {contacts.map((contact) => (
                                                        <SelectItem key={contact.id} value={contact.id}>
                                                            {contact.contactName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contactName"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>* Client Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactEmail"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Client Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactPhone"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Client Phone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactAddress"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Client Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactCity"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactState"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactZip"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>ZIP/Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactCountry"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-input border-none text-muted-foreground"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Invoice Items Section */}
                        <div className="space-y-4 bg-muted">
                            <h3 className="text-lg font-medium">Invoice Items</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-1 w-[50%]">Description</th>
                                        <th className="text-right py-2 px-1 w-[15%]">Quantity</th>
                                        <th className="text-right py-2 px-1 w-[15%]">Unit Price</th>
                                        <th className="text-right py-2 px-1 w-[15%]">Amount</th>
                                        <th className="text-right py-2 px-1 w-[5%]"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-2 px-1">
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    placeholder="Item description"
                                                    className="bg-input border-none text-muted-foreground"
                                                />
                                            </td>
                                            <td className="py-2 px-1">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                    className="bg-input border-none text-muted-foreground text-right"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="py-2 px-1">
                                                <Input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                    className="bg-input border-none text-muted-foreground text-right"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="py-2 px-1">
                                                <Input
                                                    value={item.amount}
                                                    readOnly
                                                    className="bg-input border-none text-muted-foreground text-right"
                                                />
                                            </td>
                                            <td className="py-2 px-1 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash className="h-4 w-4"/>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                                className="mt-2"
                            >
                                <Plus className="h-4 w-4 mr-2"/>
                                Add Item
                            </Button>
                        </div>

                        {/* Totals Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Totals</h3>

                            <div className="flex flex-col items-end space-y-2">
                                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                                    <div className="text-right">Subtotal:</div>
                                    <div className="text-right font-medium">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: form.watch('currency') || 'USD'
                                        }).format(parseFloat(form.watch('subtotal') || '0'))}
                                    </div>

                                    <div className="text-right flex items-center justify-end gap-2">
                                        Tax Rate (%):
                                        <div className="w-20">
                                            <Input
                                                type="number"
                                                value={form.watch('salesTaxRate') || ''}
                                                onChange={(e) => form.setValue('salesTaxRate', e.target.value)}
                                                className="bg-input border-none text-muted-foreground text-right"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right font-medium">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: form.watch('currency') || 'USD'
                                        }).format(parseFloat(form.watch('salesTaxAmount') || '0'))}
                                    </div>

                                    <div className="text-right text-lg font-bold">Total:</div>
                                    <div className="text-right text-lg font-bold text-primary">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: form.watch('currency') || 'USD'
                                        }).format(parseFloat(form.watch('totalDue') || '0'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Additional Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className="bg-input border-none text-muted-foreground min-h-[100px]"
                                                    placeholder="Additional notes to the client..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="terms"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Terms & Conditions</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className="bg-input border-none text-muted-foreground min-h-[100px]"
                                                    placeholder="Payment terms and conditions..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={generatePreview}
                            >
                                <Eye className="h-4 w-4 mr-2"/>
                                Preview
                            </Button>
                            <Button
                                type="button"
                                onClick={saveInvoice}
                            >
                                Save Invoice
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="preview">
                {invoiceData ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-md p-6 shadow-sm">
                            {/* PDF Preview would go here */}
                            <div className="flex justify-center">
                                <div className="w-full max-w-4xl">
                                    <h2 className="text-xl font-bold mb-4 text-center">Invoice Preview</h2>
                                    <div
                                        className="border p-4 rounded-md min-h-[600px] flex items-center justify-center">
                                        <p className="text-muted-foreground">
                                            PDF preview not available in browser. Please use the download button below.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPreviewMode(false)}
                            >
                                Edit Invoice
                            </Button>

                            <PDFDownloadLink
                                document={<InvoicePdf invoice={invoiceData}/>}
                                fileName={`Invoice-${invoiceData.invoiceNumber}.pdf`}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <FileText className="h-4 w-4 mr-2"/>
                                Download PDF
                            </PDFDownloadLink>

                            <Button
                                type="button"
                                onClick={sendInvoice}
                                disabled={!invoiceData.Contact?.contactEmail}
                            >
                                <Mail className="h-4 w-4 mr-2"/>
                                Send Invoice
                            </Button>

                            <Button
                                type="button"
                                onClick={saveInvoice}
                            >
                                Save Invoice
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                            Click the button below to generate a preview of your invoice.
                        </p>
                        <Button
                            type="button"
                            onClick={generatePreview}
                        >
                            <Eye className="h-4 w-4 mr-2"/>
                            Generate Preview
                        </Button>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}

export default InvoiceGenerator