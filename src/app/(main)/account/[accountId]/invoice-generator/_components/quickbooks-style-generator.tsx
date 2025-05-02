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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Mail, Eye, Plus, Trash, Upload, FileUp } from 'lucide-react'

// Custom components
import InvoicePdf from '@/app/(main)/account/[accountId]/invoices/_components/invoice-pdf'
import { createOrUpdateInvoice, saveActivityLogNotification } from '@/lib/queries'
import { emailInvoiceToContact } from '@/lib/invoice-utils'
import { Account, Contact } from '@prisma/client'

// Types
type InvoiceItem = {
    id: string
    product: string
    description: string
    quantity: string
    rate: string
    amount: string
}

type Props = {
    accountId: string
    accountDetails: Account
    contacts: Contact[]
}

const FormSchema = z.object({
    invoiceNumber: z.string(),
    invoiceDate: z.string(),
    dueDate: z.string(),
    paymentStatus: z.string().default('Unpaid'),
    currency: z.string().default('USD'),
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
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    companyCity: z.string().optional(),
    companyState: z.string().optional(),
    companyZip: z.string().optional(),
    companyPhone: z.string().optional(),
    companyEmail: z.string().optional(),
    companyWebsite: z.string().optional(),
})

const QuickbooksStyleGenerator: React.FC<Props> = ({ accountId, accountDetails, contacts }) => {
    const router = useRouter()
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: nanoid(), product: '', description: '', quantity: '1', rate: '0', amount: '0' }
    ])
    const [activeTab, setActiveTab] = useState('edit')
    const [invoiceData, setInvoiceData] = useState<any>(null)
    const [assistText, setAssistText] = useState('')
    const [isAutofilling, setIsAutofilling] = useState(false)
    const [hasCompanyDetails, setHasCompanyDetails] = useState(false)
    const [hasCustomerDetails, setHasCustomerDetails] = useState(false)

    // Get today's date and due date (30 days from now) in MM/DD/YYYY format
    const today = format(new Date(), 'MM/dd/yyyy')
    const dueDate = format(addDays(new Date(), 30), 'MM/dd/yyyy')

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            invoiceNumber: '1',
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
            companyName: accountDetails?.accountName || '',
            companyAddress: accountDetails?.address || '',
            companyCity: accountDetails?.city || '',
            companyState: accountDetails?.state || '',
            companyZip: accountDetails?.zipCode || '',
            companyPhone: '',
            companyEmail: accountDetails?.accountEmail || '',
            companyWebsite: '',
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

    // Check if company details are filled
    useEffect(() => {
        const companyName = form.watch('companyName')
        const companyAddress = form.watch('companyAddress')
        setHasCompanyDetails(!!(companyName && companyAddress))
    }, [form.watch('companyName'), form.watch('companyAddress')])

    // Check if customer details are filled
    useEffect(() => {
        const contactName = form.watch('contactName')
        const contactAddress = form.watch('contactAddress')
        setHasCustomerDetails(!!(contactName && contactAddress))
    }, [form.watch('contactName'), form.watch('contactAddress')])

    // Add a new item row
    const addItem = () => {
        setItems([...items, { id: nanoid(), product: '', description: '', quantity: '1', rate: '0', amount: '0' }])
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
                
                // Recalculate amount if quantity or rate changes
                if (field === 'quantity' || field === 'rate') {
                    const quantity = parseFloat(field === 'quantity' ? value : item.quantity) || 0
                    const rate = parseFloat(field === 'rate' ? value : item.rate) || 0
                    updatedItem.amount = (quantity * rate).toFixed(2)
                }
                
                return updatedItem
            }
            return item
        })
        
        setItems(updatedItems)
    }

    // Handle autofill from text
    const handleAutofill = async () => {
        if (!assistText.trim()) {
            toast.error('Please enter some text to autofill the invoice')
            return
        }

        setIsAutofilling(true)

        try {
            // This would be replaced with actual AI processing
            // For now, we'll simulate it with a timeout
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Parse the example text
            if (assistText.includes('EXAMPLE')) {
                // Extract customer name and address
                const customerMatch = assistText.match(/send to\s+(.*)\s+(.*)\s+(.*)/i)
                if (customerMatch && customerMatch.length >= 4) {
                    form.setValue('contactName', customerMatch[1])
                    form.setValue('contactAddress', customerMatch[2])
                    form.setValue('contactCity', customerMatch[3].split(',')[0])
                    form.setValue('contactState', customerMatch[3].split(',')[1]?.trim() || '')
                }

                // Extract items
                const lines = assistText.split('\\n')
                const newItems: InvoiceItem[] = []

                lines.forEach(line => {
                    if (line.includes(',')) {
                        const [description, amount] = line.split(',').map(s => s.trim())
                        if (description && amount) {
                            const cleanAmount = amount.replace(/[^0-9.]/g, '')
                            newItems.push({
                                id: nanoid(),
                                product: '',
                                description,
                                quantity: '1',
                                rate: cleanAmount,
                                amount: cleanAmount
                            })
                        }
                    }
                })

                if (newItems.length > 0) {
                    setItems(newItems)
                }
            }

            toast.success('Invoice autofilled successfully')
        } catch (error) {
            console.error('Error autofilling invoice:', error)
            toast.error('Failed to autofill invoice')
        } finally {
            setIsAutofilling(false)
        }
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
            invoiceNumber: parseInt(values.invoiceNumber) || Date.now(), 
            invoiceDate: new Date(values.invoiceDate),
            dueDate: new Date(values.dueDate),
            paymentStatus: values.paymentStatus,
            currency: values.currency,
            unitType: 'Custom',
            unitPrice: parseFloat(items[0].rate),
            quantity: parseInt(items[0].quantity),
            subtotal: parseFloat(values.subtotal),
            salesTaxRate: values.salesTaxRate ? parseFloat(values.salesTaxRate) : undefined,
            salesTaxAmount: values.salesTaxAmount ? parseFloat(values.salesTaxAmount) : undefined,
            totalDue: parseFloat(values.totalDue),
            Account: {
                ...accountDetails,
                accountName: values.companyName || accountDetails.accountName,
                address: values.companyAddress || accountDetails.address,
                city: values.companyCity || accountDetails.city,
                state: values.companyState || accountDetails.state,
                zipCode: values.companyZip || accountDetails.zipCode,
                accountEmail: values.companyEmail || accountDetails.accountEmail,
            },
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
        setActiveTab('pdf')
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

            // Create contact if needed
            let contactId = values.contactId
            if (!contactId && values.contactName) {
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
                unitPrice: parseFloat(items[0].rate),
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
                setActiveTab('email')
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

    // Add company details
    const addCompanyDetails = () => {
        // Open a modal or form to add company details
        // For now, we'll just set some example values
        form.setValue('companyName', accountDetails.accountName || 'Your Company Name')
        form.setValue('companyAddress', accountDetails.address || '123 Business St')
        form.setValue('companyCity', accountDetails.city || 'Business City')
        form.setValue('companyState', accountDetails.state || 'CA')
        form.setValue('companyZip', accountDetails.zipCode || '12345')
        form.setValue('companyPhone', '(555) 555-5555')
        form.setValue('companyEmail', accountDetails.accountEmail || 'contact@yourcompany.com')
        form.setValue('companyWebsite', 'www.yourcompany.com')
        
        setHasCompanyDetails(true)
    }

    // Add customer details
    const addCustomerDetails = () => {
        // If we have contacts, show a dropdown to select one
        if (contacts.length > 0) {
            // For now, we'll just use the first contact
            const contact = contacts[0]
            form.setValue('contactName', contact.contactName)
            form.setValue('contactEmail', contact.contactEmail || '')
            form.setValue('contactPhone', contact.contactPhone || '')
            
            // If the contact has a billing address
            if (contact.BillingAddress) {
                form.setValue('contactAddress', contact.BillingAddress.street)
                form.setValue('contactCity', contact.BillingAddress.city)
                form.setValue('contactState', contact.BillingAddress.state)
                form.setValue('contactZip', contact.BillingAddress.zipCode)
                form.setValue('contactCountry', contact.BillingAddress.country)
            }
        } else {
            // Otherwise, set some example values
            form.setValue('contactName', 'Customer Name')
            form.setValue('contactAddress', '456 Customer Ave')
            form.setValue('contactCity', 'Customer City')
            form.setValue('contactState', 'CA')
            form.setValue('contactZip', '54321')
            form.setValue('contactEmail', 'customer@example.com')
            form.setValue('contactPhone', '(555) 123-4567')
        }
        
        setHasCustomerDetails(true)
    }

    return (
        <div className="bg-[#f5f8fa] p-6 rounded-lg">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Assist Panel */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Autofill this invoice with text</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Copy and paste notes that include pricing, descriptions, and customer info
                    </p>
                    
                    <h3 className="text-sm font-medium mb-2">How to start your invoice</h3>
                    
                    <div className="flex gap-2 mb-4">
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-[#f0fbf9] border-[#84e5db]">
                            <div className="bg-[#D4F7F1] p-1 rounded-full">
                                <FileText className="h-4 w-4 text-[#024B3F]" />
                            </div>
                            <span className="text-sm font-medium">An example</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                            <div className="bg-[#BFDDFF] p-1 rounded-full">
                                <Upload className="h-4 w-4 text-[#08284D]" />
                            </div>
                            <span className="text-sm font-medium">Add brand</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                            <div className="bg-[#EAF7D4] p-1 rounded-full">
                                <FileUp className="h-4 w-4 text-[#365600]" />
                            </div>
                            <span className="text-sm font-medium">Add file</span>
                        </div>
                    </div>
                    
                    <Textarea 
                        className="min-h-[150px] mb-2"
                        placeholder="EXAMPLE - Here are my notes from talking to the customer today:

Alan - driveway work
demolition, 1k
framing, 400
deliver/pour 2.4k
_______
Total: $3800

send to
Alan Sample
5446 Sample Street
Sample, CA"
                        value={assistText}
                        onChange={(e) => setAssistText(e.target.value)}
                    />
                    
                    <p className="text-xs text-gray-500 mb-4">
                        {assistText.length}/1500 characters
                    </p>
                    
                    <Button 
                        className="w-full mb-4" 
                        onClick={handleAutofill}
                        disabled={isAutofilling}
                    >
                        {isAutofilling ? 'Autofilling...' : 'Autofill Invoice'}
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                        By using the Invoice Generator, you agree to the Terms of Service and Privacy Statement and confirm you have the right to use any info you enter.
                    </p>
                </div>
                
                {/* Right side - Invoice Form */}
                <div className="w-full lg:w-2/3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="pdf" onClick={generatePreview}>PDF view</TabsTrigger>
                            <TabsTrigger value="email" onClick={generatePreview}>Email view</TabsTrigger>
                            <TabsTrigger value="payor" onClick={generatePreview}>Payor view</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="edit">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <h1 className="text-2xl font-semibold">Invoice</h1>
                                    
                                    {/* Company Details */}
                                    <div className="text-right">
                                        {hasCompanyDetails ? (
                                            <div className="text-sm">
                                                <p className="font-medium">{form.watch('companyName')}</p>
                                                <p>{form.watch('companyAddress')}</p>
                                                <p>{form.watch('companyCity')}, {form.watch('companyState')} {form.watch('companyZip')}</p>
                                                <p>{form.watch('companyPhone')}</p>
                                                <p>{form.watch('companyEmail')}</p>
                                                <p>{form.watch('companyWebsite')}</p>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={addCompanyDetails}
                                            >
                                                Add company details
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Invoice Details and Customer Info */}
                                <div className="flex flex-col md:flex-row justify-between mb-6">
                                    {/* Customer Info */}
                                    <div className="mb-4 md:mb-0">
                                        <p className="text-sm font-medium mb-2">Bill to:</p>
                                        {hasCustomerDetails ? (
                                            <div className="text-sm">
                                                <p className="font-medium">{form.watch('contactName')}</p>
                                                <p>{form.watch('contactAddress')}</p>
                                                <p>{form.watch('contactCity')}, {form.watch('contactState')} {form.watch('contactZip')}</p>
                                                <p>{form.watch('contactEmail')}</p>
                                                <p>{form.watch('contactPhone')}</p>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={addCustomerDetails}
                                            >
                                                Add customer details
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Invoice Details */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500">Invoice no.</label>
                                            <Input 
                                                className="w-32"
                                                value={form.watch('invoiceNumber')}
                                                onChange={(e) => form.setValue('invoiceNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500">Invoice date</label>
                                            <Input 
                                                className="w-32"
                                                value={form.watch('invoiceDate')}
                                                onChange={(e) => form.setValue('invoiceDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500">Due date</label>
                                            <Input 
                                                className="w-32"
                                                value={form.watch('dueDate')}
                                                onChange={(e) => form.setValue('dueDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Invoice Items */}
                                <div className="mb-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2 px-1 w-[25%]">Product/Service</th>
                                                    <th className="text-left py-2 px-1 w-[35%]">Description</th>
                                                    <th className="text-right py-2 px-1 w-[10%]">Quantity</th>
                                                    <th className="text-right py-2 px-1 w-[15%]">Rate</th>
                                                    <th className="text-right py-2 px-1 w-[15%]">Amount</th>
                                                    <th className="w-[5%]"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.id} className="border-b">
                                                        <td className="py-2 px-1">
                                                            <Input
                                                                value={item.product}
                                                                onChange={(e) => updateItem(item.id, 'product', e.target.value)}
                                                                placeholder="Product/Service"
                                                                className="border-none"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-1">
                                                            <Input
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                                placeholder="Description"
                                                                className="border-none"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-1">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                                className="border-none text-right"
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-1">
                                                            <Input
                                                                type="number"
                                                                value={item.rate}
                                                                onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                                className="border-none text-right"
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-1">
                                                            <Input
                                                                value={item.amount}
                                                                readOnly
                                                                className="border-none text-right"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-1 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(item.id)}
                                                            >
                                                                <Trash className="h-4 w-4" />
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
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add row
                                    </Button>
                                </div>
                                
                                {/* Totals */}
                                <div className="flex justify-end mb-6">
                                    <div className="w-64">
                                        <div className="flex justify-between py-2">
                                            <span>Subtotal</span>
                                            <span>
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: form.watch('currency') || 'USD'
                                                }).format(parseFloat(form.watch('subtotal') || '0'))}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center py-2">
                                            <div className="flex items-center gap-2">
                                                <span>Tax</span>
                                                <Input
                                                    type="number"
                                                    value={form.watch('salesTaxRate') || ''}
                                                    onChange={(e) => form.setValue('salesTaxRate', e.target.value)}
                                                    className="w-16 h-8 text-right"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                                <span>%</span>
                                            </div>
                                            <span>
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: form.watch('currency') || 'USD'
                                                }).format(parseFloat(form.watch('salesTaxAmount') || '0'))}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between py-2 font-bold border-t">
                                            <span>Total</span>
                                            <span className="text-primary">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: form.watch('currency') || 'USD'
                                                }).format(parseFloat(form.watch('totalDue') || '0'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Notes and Terms */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Notes</label>
                                        <Textarea
                                            placeholder="Notes - any relevant information not already covered"
                                            className="min-h-[100px]"
                                            value={form.watch('notes')}
                                            onChange={(e) => form.setValue('notes', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Terms</label>
                                        <Textarea
                                            placeholder="Terms and conditions"
                                            className="min-h-[100px]"
                                            value={form.watch('terms')}
                                            onChange={(e) => form.setValue('terms', e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={generatePreview}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={saveInvoice}
                                    >
                                        Save Invoice
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="pdf">
                            {invoiceData ? (
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex justify-center">
                                        <div className="w-full max-w-4xl">
                                            <h2 className="text-xl font-bold mb-4 text-center">Invoice Preview</h2>
                                            <div className="border p-4 rounded-md min-h-[600px] flex items-center justify-center">
                                                <p className="text-muted-foreground">
                                                    PDF preview not available in browser. Please use the download button below.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('edit')}
                                        >
                                            Edit Invoice
                                        </Button>
                                        
                                        <PDFDownloadLink
                                            document={<InvoicePdf invoice={invoiceData} />}
                                            fileName={`Invoice-${invoiceData.invoiceNumber}.pdf`}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </PDFDownloadLink>
                                        
                                        <Button
                                            type="button"
                                            onClick={sendInvoice}
                                            disabled={!invoiceData.Contact?.contactEmail}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
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
                                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm">
                                    <p className="text-muted-foreground mb-4">
                                        Click the button below to generate a preview of your invoice.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={generatePreview}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Generate Preview
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="email">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-center">
                                    <div className="w-full max-w-4xl">
                                        <h2 className="text-xl font-bold mb-4 text-center">Email Preview</h2>
                                        <div className="border p-4 rounded-md min-h-[600px]">
                                            {invoiceData ? (
                                                <div className="p-4">
                                                    <div className="mb-4">
                                                        <p><strong>To:</strong> {invoiceData.Contact?.contactEmail}</p>
                                                        <p><strong>Subject:</strong> Invoice #{invoiceData.invoiceNumber} from {invoiceData.Account?.accountName}</p>
                                                    </div>
                                                    <div className="border-t pt-4">
                                                        <p>Dear {invoiceData.Contact?.contactName},</p>
                                                        <p className="my-4">Please find attached invoice #{invoiceData.invoiceNumber} for {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: invoiceData.currency || 'USD'
                                                        }).format(invoiceData.totalDue)}.</p>
                                                        <p>Payment is due by {format(new Date(invoiceData.dueDate), 'MMMM dd, yyyy')}.</p>
                                                        <p className="my-4">If you have any questions, please don't hesitate to contact us.</p>
                                                        <p>Thank you for your business!</p>
                                                        <p className="mt-4">Best regards,</p>
                                                        <p>{invoiceData.Account?.accountName}</p>
                                                        <p>{invoiceData.Account?.accountEmail}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <p className="text-muted-foreground">
                                                        Generate a preview to see the email content.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('edit')}
                                    >
                                        Edit Invoice
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        onClick={sendInvoice}
                                        disabled={!invoiceData?.Contact?.contactEmail}
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Invoice
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="payor">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-center">
                                    <div className="w-full max-w-4xl">
                                        <h2 className="text-xl font-bold mb-4 text-center">Payor View</h2>
                                        <div className="border p-4 rounded-md min-h-[600px]">
                                            {invoiceData ? (
                                                <div className="p-4">
                                                    <div className="flex justify-between mb-6">
                                                        <div>
                                                            <h1 className="text-2xl font-semibold">Invoice #{invoiceData.invoiceNumber}</h1>
                                                            <p>Date: {format(new Date(invoiceData.invoiceDate), 'MMMM dd, yyyy')}</p>
                                                            <p>Due: {format(new Date(invoiceData.dueDate), 'MMMM dd, yyyy')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">{invoiceData.Account?.accountName}</p>
                                                            <p>{invoiceData.Account?.address}</p>
                                                            <p>{invoiceData.Account?.city}, {invoiceData.Account?.state} {invoiceData.Account?.zipCode}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mb-6">
                                                        <p className="font-medium">Bill To:</p>
                                                        <p>{invoiceData.Contact?.contactName}</p>
                                                        {invoiceData.Contact?.BillingAddress && (
                                                            <>
                                                                <p>{invoiceData.Contact.BillingAddress.street}</p>
                                                                <p>{invoiceData.Contact.BillingAddress.city}, {invoiceData.Contact.BillingAddress.state} {invoiceData.Contact.BillingAddress.zipCode}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mb-6">
                                                        <table className="w-full border-collapse">
                                                            <thead>
                                                                <tr className="border-b">
                                                                    <th className="text-left py-2">Description</th>
                                                                    <th className="text-right py-2">Quantity</th>
                                                                    <th className="text-right py-2">Rate</th>
                                                                    <th className="text-right py-2">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {invoiceData.items.map((item: any) => (
                                                                    <tr key={item.id} className="border-b">
                                                                        <td className="py-2">{item.description}</td>
                                                                        <td className="py-2 text-right">{item.quantity}</td>
                                                                        <td className="py-2 text-right">
                                                                            {new Intl.NumberFormat('en-US', {
                                                                                style: 'currency',
                                                                                currency: invoiceData.currency || 'USD'
                                                                            }).format(parseFloat(item.rate))}
                                                                        </td>
                                                                        <td className="py-2 text-right">
                                                                            {new Intl.NumberFormat('en-US', {
                                                                                style: 'currency',
                                                                                currency: invoiceData.currency || 'USD'
                                                                            }).format(parseFloat(item.amount))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    
                                                    <div className="flex justify-end mb-6">
                                                        <div className="w-64">
                                                            <div className="flex justify-between py-2">
                                                                <span>Subtotal</span>
                                                                <span>
                                                                    {new Intl.NumberFormat('en-US', {
                                                                        style: 'currency',
                                                                        currency: invoiceData.currency || 'USD'
                                                                    }).format(invoiceData.subtotal)}
                                                                </span>
                                                            </div>
                                                            
                                                            {invoiceData.salesTaxRate > 0 && (
                                                                <div className="flex justify-between py-2">
                                                                    <span>Tax ({invoiceData.salesTaxRate}%)</span>
                                                                    <span>
                                                                        {new Intl.NumberFormat('en-US', {
                                                                            style: 'currency',
                                                                            currency: invoiceData.currency || 'USD'
                                                                        }).format(invoiceData.salesTaxAmount)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex justify-between py-2 font-bold border-t">
                                                                <span>Total</span>
                                                                <span>
                                                                    {new Intl.NumberFormat('en-US', {
                                                                        style: 'currency',
                                                                        currency: invoiceData.currency || 'USD'
                                                                    }).format(invoiceData.totalDue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {invoiceData.notes && (
                                                        <div className="mb-4">
                                                            <p className="font-medium">Notes:</p>
                                                            <p>{invoiceData.notes}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {invoiceData.terms && (
                                                        <div>
                                                            <p className="font-medium">Terms:</p>
                                                            <p>{invoiceData.terms}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <p className="text-muted-foreground">
                                                        Generate a preview to see the payor view.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('edit')}
                                    >
                                        Edit Invoice
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        onClick={saveInvoice}
                                    >
                                        Save Invoice
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default QuickbooksStyleGenerator