'use client'

import React, { useState, useEffect } from 'react'
import './quickbooks-style-generator.css'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { format, addDays } from 'date-fns'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import dynamic from 'next/dynamic'

// UI Components
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {FileText, Mail, Eye, Plus, Trash, Upload, FileUp, Edit, User2, Search, UserPlus} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Custom components
import ThemedEditorStylePdf from './themed-editor-style-pdf'
import { createOrUpdateInvoice, saveActivityLogNotification } from '@/lib/queries'
import { emailInvoiceToContact } from '@/lib/invoice-utils'
import { Account, Contact, BillingAddress } from '@prisma/client'
import { useTheme } from 'next-themes'

// Define a type that includes BillingAddress
type ContactWithBillingAddress = Contact & {
    BillingAddress?: BillingAddress | null
}

const InvoicePreview = dynamic(
    () => import('./invoice-preview'),
    { ssr: false }
)

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
    contacts: ContactWithBillingAddress[]
}

const FormSchema = z.object({
    invoiceNumber: z.string(),
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
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [currentTheme, setCurrentTheme] = useState('')
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: nanoid(), product: '', description: '', quantity: '1', rate: '0', amount: '0' }
    ])
    const [activeTab, setActiveTab] = useState('edit')
    const [invoiceData, setInvoiceData] = useState<any>(null)
    const [assistText, setAssistText] = useState('')
    const [isAutofilling, setIsAutofilling] = useState(false)
    const [hasCompanyDetails, setHasCompanyDetails] = useState(false)
    const [hasCustomerDetails, setHasCustomerDetails] = useState(false)
    const [isContactSheetOpen, setIsContactSheetOpen] = useState(false)
    const [isCompanyPopoverOpen, setIsCompanyPopoverOpen] = useState(false)
    const [contactSelectionMode, setContactSelectionMode] = useState<'existing' | 'new'>('existing')
    const [contactSearchQuery, setContactSearchQuery] = useState('')
    const [filteredContacts, setFilteredContacts] = useState<ContactWithBillingAddress[]>([])

    // Get today's date and due date (30 days from now) in MM/DD/YYYY format
    const today = format(new Date(), 'MM/dd/yyyy')
    const dueDate = format(addDays(new Date(), 30), 'MM/dd/yyyy')

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            invoiceNumber: '1',
            invoiceDate: today ?? '',
            dueDate: dueDate ?? '',
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
            companyName: accountDetails?.accountName ?? '',
            companyAddress: accountDetails?.address ?? '',
            companyCity: accountDetails?.city ?? '',
            companyState: accountDetails?.state ?? '',
            companyZip: accountDetails?.zipCode ?? '',
            companyPhone: '',
            companyEmail: accountDetails?.accountEmail ?? '',
            companyWebsite: '',
        },
    })

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
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }, [items, form.watch('salesTaxRate')])

    // Check if company details are filled
    useEffect(() => {
        const companyName = form.watch('companyName')
        const companyAddress = form.watch('companyAddress')
        setHasCompanyDetails(!!(companyName && companyAddress))
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }, [form.watch('companyName'), form.watch('companyAddress')])

    // Check if customer details are filled
    useEffect(() => {
        const contactName = form.watch('contactName')
        const contactAddress = form.watch('contactAddress')
        setHasCustomerDetails(!!(contactName && contactAddress))
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }, [form.watch('contactName'), form.watch('contactAddress')])

    // Filter contacts based on search query
    useEffect(() => {
        if (contactSearchQuery.trim() === '') {
            setFilteredContacts(contacts);
        } else {
            const query = contactSearchQuery.toLowerCase();
            const filtered = contacts.filter(contact => 
                contact.contactName.toLowerCase().includes(query) || 
                (contact.contactEmail && contact.contactEmail.toLowerCase().includes(query)) ||
                (contact.contactPhone && contact.contactPhone.toLowerCase().includes(query))
            );
            setFilteredContacts(filtered);
        }
    }, [contactSearchQuery, contacts]);

    // Only execute client-side
    useEffect(() => {
        setMounted(true);
        setFilteredContacts(contacts);
    }, [contacts]);
    
    // Watch for changes to any form field and update the preview
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            // Only update the preview if we're in PDF view and a field has changed
            if (activeTab === 'pdf' && type === 'change') {
                // Use a debounce to avoid too many updates
                const timeoutId = setTimeout(() => {
                    console.log(`Form field "${name}" changed, updating preview...`);
                    updatePreviewIfActive();
                }, 500);
                
                return () => clearTimeout(timeoutId);
            }
        });
        
        return () => subscription.unsubscribe();
    }, [form, activeTab]);
    
    // Watch for tab changes and update the preview when switching to PDF tab
    useEffect(() => {
        if (activeTab === 'pdf') {
            console.log('Switched to PDF tab, generating preview...');
            generatePreview(false);
        }
    }, [activeTab]);

    // Update theme when it changes
    useEffect(() => {
        if (mounted) {
            const activeTheme = resolvedTheme || theme;
            console.log('Generator - Active theme from provider:', activeTheme);

            let themeColor = 'default';

            // Check for specific theme names that match our theme-colors.ts keys
            if (activeTheme === 'blue-light' || activeTheme === 'blue-dark' || activeTheme === 'blue') {
                themeColor = 'blue';
            } else if (activeTheme === 'red-light' || activeTheme === 'red-dark' || activeTheme === 'red') {
                themeColor = 'red';
            } else if (activeTheme === 'green-light' || activeTheme === 'green-dark' || activeTheme === 'green') {
                themeColor = 'green';
            } else if (activeTheme === 'orange-light' || activeTheme === 'orange-dark' || activeTheme === 'orange') {
                themeColor = 'orange';
            } else if (activeTheme === 'pink-light' || activeTheme === 'pink-dark' || activeTheme === 'pink') {
                themeColor = 'pink';
            } else if (activeTheme === 'yellow-light' || activeTheme === 'yellow-dark' || activeTheme === 'yellow') {
                themeColor = 'yellow';
            }

            console.log('Generator - Setting theme color to:', themeColor);
            setCurrentTheme(themeColor);
        }
    }, [theme, resolvedTheme, mounted])

    // Add a new item row
    const addItem = () => {
        setItems([...items, { id: nanoid(), product: '', description: '', quantity: '1', rate: '0', amount: '0' }])
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }

    // Remove an item row
    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id))
            // Update the preview if we're in PDF view
            updatePreviewIfActive()
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
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }

    // Simple pattern-based extraction as fallback when AI is unavailable
    const extractInvoiceDataWithoutAI = (text) => {
        const result = {
            customer: {
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: ''
            },
            items: [],
            notes: '',
            terms: ''
        };
        
        // Extract customer information using regex patterns
        const nameMatch = text.match(/(?:bill to|customer|client|recipient)[:;\s]+([^\n,]+)/i);
        if (nameMatch) result.customer.name = nameMatch[1].trim();
        
        const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) result.customer.email = emailMatch[0];
        
        const phoneMatch = text.match(/(?:phone|tel|telephone|contact)[:;\s]+([0-9()\s\-+.]{7,})/i);
        if (phoneMatch) result.customer.phone = phoneMatch[1].trim();
        
        const addressMatch = text.match(/(?:address|location)[:;\s]+([^\n]+)/i);
        if (addressMatch) result.customer.address = addressMatch[1].trim();
        
        // Extract items by looking for patterns like quantities and amounts
        const lines = text.split('\n');
        for (const line of lines) {
            // Look for lines with numbers that might be quantities and prices
            const itemMatch = line.match(/(.+?)(?:\s+)(\d+)(?:\s+)(?:\$|€|£)?(\d+(?:\.\d{1,2})?)/);
            if (itemMatch) {
                const [_, description, quantity, rate] = itemMatch;
                const amount = (parseFloat(quantity) * parseFloat(rate)).toFixed(2);
                
                result.items.push({
                    product: '',
                    description: description.trim(),
                    quantity,
                    rate,
                    amount
                });
            }
        }
        
        // Extract notes
        const notesMatch = text.match(/(?:notes|comments|additional information)[:;\s]+([^\n]+)/i);
        if (notesMatch) result.notes = notesMatch[1].trim();
        
        // Extract terms
        const termsMatch = text.match(/(?:terms|payment terms|conditions)[:;\s]+([^\n]+)/i);
        if (termsMatch) result.terms = termsMatch[1].trim();
        
        return result;
    };

    // Handle autofill from text using AI
    const handleAutofill = async () => {
        if (!assistText.trim()) {
            toast.error('Please enter some text to autofill the invoice')
            return
        }

        setIsAutofilling(true)

        try {
            // Show a loading toast
            const loadingToast = toast.loading('AI is analyzing your text...')
            
            // First try with the AI service
            let useAIFallback = false;
            let response;
            
            try {
                // Call our AI API endpoint
                response = await fetch('/api/ai/invoice-autofill', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: assistText }),
                });
            } catch (networkError) {
                console.error('Network error when calling AI service:', networkError);
                useAIFallback = true;
                toast.dismiss(loadingToast);
                toast.loading('Using fallback text analysis...');
            }

            // Dismiss the loading toast if it wasn't already dismissed
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            let data;
            
            // If we need to use the fallback (due to network error or other issues)
            if (useAIFallback || !response || !response.ok) {
                // If we have a response but it's not OK, log the error
                if (response && !response.ok) {
                    let responseData;
                    try {
                        responseData = await response.json();
                        console.error('AI service error:', responseData);
                        
                        // If this is a network restriction, show a specific message
                        if (responseData.error && responseData.error.includes('Network restriction')) {
                            toast.error('Network restriction detected. Using fallback text analysis instead.');
                        }
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                }
                
                // Use our fallback extraction method
                toast.loading('Using basic text analysis instead of AI...');
                data = extractInvoiceDataWithoutAI(assistText);
                toast.success('Basic text analysis completed');
            } else {
                // Parse the response JSON from the AI service
                try {
                    const responseData = await response.json();
                    data = responseData;
                } catch (e) {
                    console.error('Failed to parse AI response:', e);
                    // Fall back to basic extraction
                    toast.warning('AI response could not be processed. Using basic text analysis instead.');
                    data = extractInvoiceDataWithoutAI(assistText);
                }
            }
            console.log('AI extracted data:', data)

            // Update customer information
            if (data.customer) {
                const { name, email, phone, address, city, state, zip, country } = data.customer
                
                if (name) form.setValue('contactName', name)
                if (email) form.setValue('contactEmail', email)
                if (phone) form.setValue('contactPhone', phone)
                if (address) form.setValue('contactAddress', address)
                if (city) form.setValue('contactCity', city)
                if (state) form.setValue('contactState', state)
                if (zip) form.setValue('contactZip', zip)
                if (country) form.setValue('contactCountry', country)
            }

            // Update invoice items
            if (data.items && data.items.length > 0) {
                const newItems: InvoiceItem[] = data.items.map((item: any) => {
                    const quantity = item.quantity || '1'
                    const rate = item.rate ? item.rate.toString().replace(/[^0-9.]/g, '') : '0'
                    const amount = (parseFloat(quantity) * parseFloat(rate)).toFixed(2)
                    
                    return {
                        id: nanoid(),
                        product: item.product || '',
                        description: item.description || '',
                        quantity: quantity,
                        rate: rate,
                        amount: amount
                    }
                })

                if (newItems.length > 0) {
                    setItems(newItems)
                }
            }

            // Update notes and terms
            if (data.notes) form.setValue('notes', data.notes)
            if (data.terms) form.setValue('terms', data.terms)

            // Fallback to simple pattern matching if AI doesn't extract enough data
            if (!data.customer?.name && !data.items?.length && assistText.includes('EXAMPLE')) {
                // Extract customer name and address using regex as fallback
                const customerMatch = assistText.match(/send to\s+(.*)\s+(.*)\s+(.*)/i)
                if (customerMatch && customerMatch.length >= 4) {
                    form.setValue('contactName', customerMatch[1])
                    form.setValue('contactAddress', customerMatch[2])
                    form.setValue('contactCity', customerMatch[3].split(',')[0])
                    form.setValue('contactState', customerMatch[3].split(',')[1]?.trim() || '')
                }

                // Extract items using simple parsing as fallback
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

            toast.success('Invoice autofilled successfully with AI')
        } catch (error) {
            console.error('Error autofilling invoice:', error)
            
            // Try to use the fallback extraction method
            try {
                toast.loading('Attempting to use basic text analysis instead...')
                const fallbackData = extractInvoiceDataWithoutAI(assistText)
                
                // Update customer information
                if (fallbackData.customer) {
                    const { name, email, phone, address, city, state, zip, country } = fallbackData.customer
                    
                    if (name) form.setValue('contactName', name)
                    if (email) form.setValue('contactEmail', email)
                    if (phone) form.setValue('contactPhone', phone)
                    if (address) form.setValue('contactAddress', address)
                    if (city) form.setValue('contactCity', city)
                    if (state) form.setValue('contactState', state)
                    if (zip) form.setValue('contactZip', zip)
                    if (country) form.setValue('contactCountry', country)
                }
                
                // Update invoice items
                if (fallbackData.items && fallbackData.items.length > 0) {
                    const newItems = fallbackData.items.map(item => ({
                        id: nanoid(),
                        product: item.product || '',
                        description: item.description || '',
                        quantity: item.quantity || '1',
                        rate: item.rate || '0',
                        amount: item.amount || '0'
                    }))
                    
                    if (newItems.length > 0) {
                        setItems(newItems)
                    }
                }
                
                // Update notes and terms
                if (fallbackData.notes) form.setValue('notes', fallbackData.notes)
                if (fallbackData.terms) form.setValue('terms', fallbackData.terms)
                
                toast.success('Basic text analysis completed')
                
                // Show a message about the fallback
                toast('AI service was unavailable, so we used basic text analysis instead', {
                    duration: 5000,
                    action: {
                        label: 'OK',
                        onClick: () => {}
                    }
                })
                
                return // Exit the catch block successfully
            } catch (fallbackError) {
                console.error('Fallback extraction also failed:', fallbackError)
                // Continue to the error messages below
            }
            
            // Show a more user-friendly error message if fallback also failed
            if (error instanceof Error) {
                // Check for specific error messages
                if (error.message.includes('Network restriction detected')) {
                    toast.error('Your network is blocking access to the AI service. Please contact your IT department or try using a different network connection.')
                    
                    // Show a more detailed explanation
                    toast('This is typically due to corporate firewall or DNS restrictions', {
                        duration: 8000,
                        action: {
                            label: 'Understand',
                            onClick: () => {}
                        }
                    })
                } else if (error.message.includes('OpenAI API key')) {
                    toast.error('AI service is not properly configured. Please contact support.')
                } else if (error.message.includes('rate limit')) {
                    toast.error('AI service is currently busy. Please try again in a few minutes.')
                } else if (error.message.includes('Access to the AI service is blocked')) {
                    toast.error('Access to the AI service is blocked. This could be due to network restrictions.')
                } else {
                    toast.error(error.message)
                }
            } else {
                toast.error('Failed to autofill invoice. Please try again or enter details manually.')
            }
            
            // If both AI and fallback fail, suggest manual entry
            toast('You can still fill in the invoice details manually', {
                duration: 5000,
                action: {
                    label: 'Dismiss',
                    onClick: () => {}
                }
            })
        } finally {
            setIsAutofilling(false)
        }
    }

    // Generate preview data
    const generatePreview = async (switchToPdf = true) => {
        const values = form.getValues()

        // Use the current theme from state (which is already processed)
        console.log('generatePreview - Current theme:', currentTheme);
        
        // Debug customer details
        console.log('Customer details from form:', {
            contactName: values.contactName,
            contactEmail: values.contactEmail,
            contactPhone: values.contactPhone,
            contactAddress: values.contactAddress,
            contactCity: values.contactCity,
            contactState: values.contactState,
            contactZip: values.contactZip,
            contactCountry: values.contactCountry,
        });

        // Create invoice data for preview that directly matches the form fields
        const previewData = {
            invoiceNumber: values.invoiceNumber || '',
            invoiceDate: values.invoiceDate || '',
            dueDate: values.dueDate || '',
            paymentStatus: values.paymentStatus || 'Unpaid',
            currency: values.currency || 'USD',
            subtotal: values.subtotal || '0',
            salesTaxRate: values.salesTaxRate || '',
            salesTaxAmount: values.salesTaxAmount || '0',
            totalDue: values.totalDue || '0',

            // Company details - directly from form fields
            companyName: values.companyName || '',
            companyAddress: values.companyAddress || '',
            companyCity: values.companyCity || '',
            companyState: values.companyState || '',
            companyZip: values.companyZip || '',
            companyPhone: values.companyPhone || '',
            companyEmail: values.companyEmail || '',
            companyWebsite: values.companyWebsite || '',

            // Contact details - directly from form fields
            contactName: values.contactName || '',
            contactEmail: values.contactEmail || '',
            contactPhone: values.contactPhone || '',
            contactAddress: values.contactAddress || '',
            contactCity: values.contactCity || '',
            contactState: values.contactState || '',
            contactZip: values.contactZip || '',
            contactCountry: values.contactCountry || '',

            // Items - directly from the items state
            items: items,

            // Notes and terms
            notes: values.notes || '',
            terms: values.terms || '',

            // Use the current theme from state
            theme: currentTheme
        }

        console.log('Setting invoice data:', previewData);
        setInvoiceData(previewData)
        if (switchToPdf) {
            setActiveTab('pdf')
        }
    }
    
    // Helper function to update the preview if the PDF tab is active
    const updatePreviewIfActive = () => {
        if (activeTab === 'pdf') {
            console.log('Updating PDF preview...');
            
            // Get the latest form values
            const values = form.getValues();
            
            // Create updated invoice data
            const updatedPreviewData = {
                invoiceNumber: values.invoiceNumber || '',
                invoiceDate: values.invoiceDate || '',
                dueDate: values.dueDate || '',
                paymentStatus: values.paymentStatus || 'Unpaid',
                currency: values.currency || 'USD',
                subtotal: values.subtotal || '0',
                salesTaxRate: values.salesTaxRate || '',
                salesTaxAmount: values.salesTaxAmount || '0',
                totalDue: values.totalDue || '0',
                
                // Company details
                companyName: values.companyName || '',
                companyAddress: values.companyAddress || '',
                companyCity: values.companyCity || '',
                companyState: values.companyState || '',
                companyZip: values.companyZip || '',
                companyPhone: values.companyPhone || '',
                companyEmail: values.companyEmail || '',
                companyWebsite: values.companyWebsite || '',
                
                // Contact details
                contactName: values.contactName || '',
                contactEmail: values.contactEmail || '',
                contactPhone: values.contactPhone || '',
                contactAddress: values.contactAddress || '',
                contactCity: values.contactCity || '',
                contactState: values.contactState || '',
                contactZip: values.contactZip || '',
                contactCountry: values.contactCountry || '',
                
                // Items
                items: items,
                
                // Notes and terms
                notes: values.notes || '',
                terms: values.terms || '',
                
                // Theme
                theme: currentTheme
            };
            
            console.log('Updating invoice data with:', updatedPreviewData);
            
            // Update the invoice data state
            setInvoiceData(updatedPreviewData);
        }
    }

    // Save invoice to database
    const saveInvoice = async () => {
        try {
            const values = form.getValues()

            // Basic validation - we need at least some customer info and items
            if (!values.contactName) {
                toast.error('Please add customer details')
                return
            }

            if (items.length === 0 || !items.some(item => item.description)) {
                toast.error('Please add at least one item with a description')
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
                    expirationDate: new Date(values.dueDate || new Date()),
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

            // Create invoice - parse values safely
            const invoiceData = {
                id: nanoid(),
                invoiceDate: values.invoiceDate || format(new Date(), 'MM/dd/yyyy'),
                dueDate: values.dueDate || format(addDays(new Date(), 30), 'MM/dd/yyyy'),
                paymentStatus: values.paymentStatus || 'Unpaid',
                currency: values.currency || 'USD',
                unitType: 'Custom',
                unitPrice: parseFloat(items[0].rate || '0') || 0,
                quantity: parseInt(items[0].quantity || '1') || 1,
                subtotal: parseFloat(values.subtotal || '0') || 0,
                salesTaxRate: values.salesTaxRate ? parseFloat(values.salesTaxRate) : 0,
                salesTaxAmount: values.salesTaxAmount ? parseFloat(values.salesTaxAmount) : 0,
                totalDue: parseFloat(values.totalDue || '0') || 0,
                contactId: contactId,
                projectId: projectData.project.id,
                contractId: contractData.contract.id,
                // Store additional data as metadata
                metadata: JSON.stringify({
                    companyName: values.companyName,
                    companyAddress: values.companyAddress,
                    companyCity: values.companyCity,
                    companyState: values.companyState,
                    companyZip: values.companyZip,
                    companyPhone: values.companyPhone,
                    companyEmail: values.companyEmail,
                    companyWebsite: values.companyWebsite,
                    items: items
                })
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

    // Add or edit customer details
    const addCustomerDetails = () => {
        // Open the sheet to select or create a contact
        setContactSelectionMode('existing');
        setContactSearchQuery('');
        setFilteredContacts(contacts);
        setIsContactSheetOpen(true);
    }
    
    // Handle selecting an existing contact
    const handleSelectContact = (contact: ContactWithBillingAddress) => {
        form.setValue('contactName', contact.contactName)
        form.setValue('contactEmail', contact.contactEmail || '')
        form.setValue('contactPhone', contact.contactPhone || '')
        form.setValue('contactId', contact.id)
        
        // If the contact has a billing address
        if (contact.BillingAddress) {
            form.setValue('contactAddress', contact.BillingAddress.street)
            form.setValue('contactCity', contact.BillingAddress.city)
            form.setValue('contactState', contact.BillingAddress.state)
            form.setValue('contactZip', contact.BillingAddress.zipCode)
            form.setValue('contactCountry', contact.BillingAddress.country)
        }
        
        setHasCustomerDetails(true)
        setIsContactSheetOpen(false)
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }
    
    // Handle creating or updating a contact
    const handleCreateContact = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        const formData = new FormData(e.currentTarget)
        const contactName = formData.get('contactName') as string
        const contactEmail = formData.get('contactEmail') as string
        const contactPhone = formData.get('contactPhone') as string
        const contactAddress = formData.get('contactAddress') as string
        const contactCity = formData.get('contactCity') as string
        const contactState = formData.get('contactState') as string
        const contactZip = formData.get('contactZip') as string
        
        if (!contactName || !contactAddress) {
            toast.error('Contact name and address are required')
            return
        }
        
        // Set the form values
        form.setValue('contactName', contactName)
        form.setValue('contactEmail', contactEmail || '')
        form.setValue('contactPhone', contactPhone || '')
        form.setValue('contactAddress', contactAddress)
        form.setValue('contactCity', contactCity || '')
        form.setValue('contactState', contactState || '')
        form.setValue('contactZip', contactZip || '')
        
        setHasCustomerDetails(true)
        setIsContactSheetOpen(false)
        
        // Show success message
        const isEditing = hasCustomerDetails
        toast.success(`Contact details ${isEditing ? 'updated' : 'added'} to invoice`)
        
        // Update the preview if we're in PDF view
        updatePreviewIfActive()
    }

    return (
        <div className="bg-[#f5f8fa] p-6 quickbooks-invoice">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Assist Panel */}
                <div className="w-full lg:w-1/3 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">AI-Powered Invoice Autofill</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Copy and paste your notes, emails, or any text with pricing, descriptions, and customer info. Our AI will extract the relevant details.
                    </p>
                    
                    {/*<h3 className="text-sm font-medium mb-2">How to start your invoice</h3>*/}
                    
                    {/*<div className="flex gap-2 mb-4">*/}
                    {/*    <div className="flex items-center gap-2 p-2 border rounded-md bg-[#f0fbf9] border-[#84e5db]">*/}
                    {/*        <div className="bg-[#D4F7F1] p-1 rounded-full">*/}
                    {/*            <FileText className="h-4 w-4 text-[#024B3F]" />*/}
                    {/*        </div>*/}
                    {/*        <span className="text-sm font-medium">An example</span>*/}
                    {/*    </div>*/}
                    {/*    <div className="flex items-center gap-2 p-2 border rounded-md">*/}
                    {/*        <div className="bg-[#BFDDFF] p-1 rounded-full">*/}
                    {/*            <Upload className="h-4 w-4 text-[#08284D]" />*/}
                    {/*        </div>*/}
                    {/*        <span className="text-sm font-medium">Add brand</span>*/}
                    {/*    </div>*/}
                    {/*    <div className="flex items-center gap-2 p-2 border rounded-md">*/}
                    {/*        <div className="bg-[#EAF7D4] p-1 rounded-full">*/}
                    {/*            <FileUp className="h-4 w-4 text-[#365600]" />*/}
                    {/*        </div>*/}
                    {/*        <span className="text-sm font-medium">Add file</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    
                    <Textarea 
                        className="min-h-[150px] mb-2"
                        placeholder="Just finished the project for John Smith. Here's the breakdown:
- Website design: $1,500
- Logo creation: $500
- SEO setup: $800
- Content writing (5 pages): $750

Total comes to $3,550. Should be sent to:
John Smith
123 Business Ave
San Francisco, CA 94107
john.smith@example.com
(555) 123-4567

Payment due in 30 days."
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
                        {isAutofilling ? 'AI is analyzing...' : 'Autofill with AI'}
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                        By using the Invoice Generator, you agree to the Terms of Service and Privacy Statement and confirm you have the right to use any info you enter.
                    </p>
                </div>
                
                {/* Right side - Invoice Form */}
                <div className="w-full lg:w-2/3">
                    <Tabs value={activeTab} onValueChange={(value) => {
                            // Generate preview if switching to a tab that needs it
                            if (value !== 'edit' && !invoiceData) {
                                generatePreview().then(() => {
                                    setActiveTab(value);
                                });
                            } else {
                                setActiveTab(value);
                            }
                        }} className="w-full">
                        <TabsList className="mb-4 rounded-none bg-transparent">
                            <TabsTrigger value="edit"> <Edit className={'text-primary'} /> Edit</TabsTrigger>
                            <TabsTrigger value="pdf"> <FileText className={'text-primary'} /> PDF view</TabsTrigger>
                            <TabsTrigger value="email"> <Mail className={'text-primary'} /> Email view</TabsTrigger>
                            <TabsTrigger value="payor"> <User2 className={'text-primary'}/> Payor view</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="edit">
                            <div className="bg-white p-6 shadow-sm">
                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <h1 className="text-2xl font-semibold text-primary">INVOICE</h1>
                                    
                                    {/* Company Details */}
                                    <div className="text-right">
                                        {hasCompanyDetails ? (
                                            <div className="text-sm">
                                                <div className="flex items-center justify-end mb-2">
                                                    <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-xs"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Edit
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-4 quickbooks-invoice-popover" align="end">
                                                            <form onSubmit={(e) => {
                                                                e.preventDefault();
                                                                const formData = new FormData(e.currentTarget);
                                                                
                                                                // Update form values
                                                                form.setValue('companyName', formData.get('companyName') as string || '');
                                                                form.setValue('companyAddress', formData.get('companyAddress') as string || '');
                                                                form.setValue('companyCity', formData.get('companyCity') as string || '');
                                                                form.setValue('companyState', formData.get('companyState') as string || '');
                                                                form.setValue('companyZip', formData.get('companyZip') as string || '');
                                                                form.setValue('companyPhone', formData.get('companyPhone') as string || '');
                                                                form.setValue('companyEmail', formData.get('companyEmail') as string || '');
                                                                form.setValue('companyWebsite', formData.get('companyWebsite') as string || '');
                                                                
                                                                // Update the preview if we're in PDF view
                                                                updatePreviewIfActive();
                                                                
                                                                // Close the popover
                                                                setIsCompanyPopoverOpen(false);
                                                                
                                                                // Show success message
                                                                toast.success('Company details updated');
                                                            }} className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="companyName">Company Name</Label>
                                                                    <Input 
                                                                        id="companyName" 
                                                                        name="companyName" 
                                                                        defaultValue={form.watch('companyName')} 
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="companyAddress">Address</Label>
                                                                    <Input 
                                                                        id="companyAddress" 
                                                                        name="companyAddress" 
                                                                        defaultValue={form.watch('companyAddress')} 
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="companyCity">City</Label>
                                                                        <Input 
                                                                            id="companyCity" 
                                                                            name="companyCity" 
                                                                            defaultValue={form.watch('companyCity')} 
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="companyState">State</Label>
                                                                        <Input 
                                                                            id="companyState" 
                                                                            name="companyState" 
                                                                            defaultValue={form.watch('companyState')} 
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="companyZip">Zip</Label>
                                                                        <Input 
                                                                            id="companyZip" 
                                                                            name="companyZip" 
                                                                            defaultValue={form.watch('companyZip')} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="companyPhone">Phone</Label>
                                                                    <Input 
                                                                        id="companyPhone" 
                                                                        name="companyPhone" 
                                                                        defaultValue={form.watch('companyPhone')} 
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="companyEmail">Email</Label>
                                                                    <Input 
                                                                        id="companyEmail" 
                                                                        name="companyEmail" 
                                                                        defaultValue={form.watch('companyEmail')} 
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="companyWebsite">Website</Label>
                                                                    <Input 
                                                                        id="companyWebsite" 
                                                                        name="companyWebsite" 
                                                                        defaultValue={form.watch('companyWebsite')} 
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end pt-2">
                                                                    <Button type="submit">Save</Button>
                                                                </div>
                                                            </form>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <p className="font-medium">{form.watch('companyName')}</p>
                                                <p>{form.watch('companyAddress')}</p>
                                                <p>{form.watch('companyCity')}, {form.watch('companyState')} {form.watch('companyZip')}</p>
                                                {form.watch('companyPhone') && <p>{form.watch('companyPhone')}</p>}
                                                {form.watch('companyEmail') && <p>{form.watch('companyEmail')}</p>}
                                                {form.watch('companyWebsite') && <p>{form.watch('companyWebsite')}</p>}
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
                                <div className={'flex flex-col bg-muted mx-[-25]'}>
                                    <div className="flex flex-col md:flex-row justify-between mb-6 px-6 pt-2">
                                        {/* Customer Info */}
                                        <div className="mb-4 md:mb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium">Bill to:</p>
                                                {hasCustomerDetails && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={addCustomerDetails}
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                )}
                                            </div>
                                            {hasCustomerDetails ? (
                                                <div className="text-sm">
                                                    <p className="font-medium">{form.watch('contactName')}</p>
                                                    <p>{form.watch('contactAddress')}</p>
                                                    <p>{form.watch('contactCity')}, {form.watch('contactState')} {form.watch('contactZip')}</p>
                                                    {form.watch('contactEmail') && <p>{form.watch('contactEmail')}</p>}
                                                    {form.watch('contactPhone') && <p>{form.watch('contactPhone')}</p>}
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="link"
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
                                            <InvoicePreview invoiceData={invoiceData} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('edit')}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Invoice
                                        </Button>

                                        <PDFDownloadLink
                                            document={
                                                <ThemedEditorStylePdf 
                                                    invoice={{
                                                        ...invoiceData,
                                                        theme: currentTheme
                                                    }} 
                                                />
                                            }
                                            fileName={`Invoice-${invoiceData.invoiceNumber}.pdf`}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                        >
                                            {({ loading }) => (
                                                <>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    {loading ? 'Preparing PDF...' : 'Download PDF'}
                                                </>
                                            )}
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
                                        <Edit className="h-4 w-4 mr-2" />
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
                                        <Edit className="h-4 w-4 mr-2" />
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
            
            {/* Contact Selection Sheet */}
            <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
                <SheetContent className="w-full md:max-w-md overflow-y-auto quickbooks-invoice-sheet">
                    <SheetHeader>
                        <SheetTitle>{hasCustomerDetails ? 'Edit Customer Details' : 'Add Customer Details'}</SheetTitle>
                        <SheetDescription>
                            {hasCustomerDetails 
                                ? 'Edit existing details or select a different contact' 
                                : 'Select an existing contact or create a new one'}
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-6">
                        <RadioGroup 
                            defaultValue="existing" 
                            value={contactSelectionMode}
                            onValueChange={(value) => setContactSelectionMode(value as 'existing' | 'new')}
                            className="flex flex-col space-y-1 mb-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="existing" id="existing" />
                                <Label htmlFor="existing" className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Select Existing Contact
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new" className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Create New Contact
                                </Label>
                            </div>
                        </RadioGroup>
                        
                        {contactSelectionMode === 'existing' ? (
                            <div className="space-y-4">
                                <Command className="rounded-lg border shadow-md">
                                    <CommandInput 
                                        placeholder="Search contacts..." 
                                        value={contactSearchQuery}
                                        onValueChange={setContactSearchQuery}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No contacts found</CommandEmpty>
                                        <CommandGroup heading="Contacts">
                                            {filteredContacts.map((contact) => (
                                                <CommandItem
                                                    key={contact.id}
                                                    onSelect={() => handleSelectContact(contact)}
                                                    className="flex flex-col items-start py-3 cursor-pointer"
                                                >
                                                    <div className="font-medium">{contact.contactName}</div>
                                                    {contact.contactEmail && (
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {contact.contactEmail}
                                                        </div>
                                                    )}
                                                    {contact.contactPhone && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {contact.contactPhone}
                                                        </div>
                                                    )}
                                                    {contact.BillingAddress && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {contact.BillingAddress.street}, {contact.BillingAddress.city}, {contact.BillingAddress.state} {contact.BillingAddress.zipCode}
                                                        </div>
                                                    )}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateContact} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Contact Name *</Label>
                                    <Input 
                                        id="contactName" 
                                        name="contactName" 
                                        placeholder="Contact Name" 
                                        defaultValue={hasCustomerDetails ? form.watch('contactName') : ''}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Email</Label>
                                    <Input 
                                        id="contactEmail" 
                                        name="contactEmail" 
                                        type="email" 
                                        placeholder="Email Address" 
                                        defaultValue={hasCustomerDetails ? form.watch('contactEmail') : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Phone</Label>
                                    <Input 
                                        id="contactPhone" 
                                        name="contactPhone" 
                                        placeholder="Phone Number" 
                                        defaultValue={hasCustomerDetails ? form.watch('contactPhone') : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactAddress">Street Address *</Label>
                                    <Input 
                                        id="contactAddress" 
                                        name="contactAddress" 
                                        placeholder="Street Address" 
                                        defaultValue={hasCustomerDetails ? form.watch('contactAddress') : ''}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactCity">City</Label>
                                        <Input 
                                            id="contactCity" 
                                            name="contactCity" 
                                            placeholder="City" 
                                            defaultValue={hasCustomerDetails ? form.watch('contactCity') : ''}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactState">State</Label>
                                        <Input 
                                            id="contactState" 
                                            name="contactState" 
                                            placeholder="State" 
                                            defaultValue={hasCustomerDetails ? form.watch('contactState') : ''}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactZip">Zip Code</Label>
                                    <Input 
                                        id="contactZip" 
                                        name="contactZip" 
                                        placeholder="Zip Code" 
                                        defaultValue={hasCustomerDetails ? form.watch('contactZip') : ''}
                                    />
                                </div>
                                
                                <SheetFooter className="pt-4">
                                    <SheetClose asChild>
                                        <Button variant="outline" type="button">Cancel</Button>
                                    </SheetClose>
                                    <Button type="submit">{hasCustomerDetails ? 'Update Contact' : 'Add Contact'}</Button>
                                </SheetFooter>
                            </form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default QuickbooksStyleGenerator