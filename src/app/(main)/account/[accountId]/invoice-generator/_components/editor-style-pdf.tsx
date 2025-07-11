import React from 'react'
import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer"
import { format } from 'date-fns'

type InvoiceItem = {
    id: string
    product: string
    description: string
    quantity: string
    rate: string
    amount: string
}

type InvoiceData = {
    invoiceNumber: string | number
    invoiceDate: string | Date
    dueDate: string | Date
    paymentStatus: string
    currency: string
    subtotal: string | number
    salesTaxRate?: string | number
    salesTaxAmount?: string | number
    totalDue: string | number
    items: InvoiceItem[]
    notes?: string
    terms?: string
    companyName?: string
    companyAddress?: string
    companyCity?: string
    companyState?: string
    companyZip?: string
    companyPhone?: string
    companyEmail?: string
    companyWebsite?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contactAddress?: string
    contactCity?: string
    contactState?: string
    contactZip?: string
    contactCountry?: string
}

type Props = {
    invoice: InvoiceData
}

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    section: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    headerLeft: {
        width: '50%',
    },
    headerRight: {
        width: '50%',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 16,
        marginBottom: 10,
        color: '#1F2937',
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    text: {
        fontSize: 10,
        marginBottom: 3,
        color: '#4B5563',
    },
    textBold: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#1F2937',
    },
    detailsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: '#F9FAFB',
    },
    detailsLeft: {
        width: '50%',
    },
    detailsRight: {
        width: '50%',
        alignItems: 'flex-end',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    table: {
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        borderBottomStyle: 'solid',
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: '#F9FAFB',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        borderBottomStyle: 'solid',
        paddingVertical: 8,
    },
    tableColProduct: {
        width: '25%',
        fontSize: 10,
        paddingHorizontal: 5,
    },
    tableColDescription: {
        width: '35%',
        fontSize: 10,
        paddingHorizontal: 5,
    },
    tableColQuantity: {
        width: '10%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
    },
    tableColRate: {
        width: '15%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
    },
    tableColAmount: {
        width: '15%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    totalsSection: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '30%',
        marginBottom: 5,
    },
    totalsLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    totalsValue: {
        fontSize: 10,
        textAlign: 'right',
    },
    totalDueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '30%',
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopStyle: 'solid',
        paddingTop: 5,
    },
    totalDueLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    totalDueValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    notesTermsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    notesSection: {
        width: '48%',
    },
    termsSection: {
        width: '48%',
    },
    footer: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopStyle: 'solid',
        paddingTop: 10,
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
    },
});

const EditorStylePdf = ({ invoice }: Props) => {
    if (!invoice) return null;

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice.currency || 'USD'
        }).format(numAmount);
    };

    const formatDate = (date: string | Date) => {
        if (!date) return '';
        try {
            return format(new Date(date), 'MM/dd/yyyy');
        } catch {
            return String(date);
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>INVOICE</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.textBold}>{invoice.companyName || ''}</Text>
                        <Text style={styles.text}>{invoice.companyAddress || ''}</Text>
                        <Text style={styles.text}>
                            {invoice.companyCity ? `${invoice.companyCity}, ` : ''}
                            {invoice.companyState || ''} {invoice.companyZip || ''}
                        </Text>
                        <Text style={styles.text}>{invoice.companyPhone || ''}</Text>
                        <Text style={styles.text}>{invoice.companyEmail || ''}</Text>
                        <Text style={styles.text}>{invoice.companyWebsite || ''}</Text>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <View style={styles.detailsLeft}>
                        <Text style={styles.sectionTitle}>Bill to:</Text>
                        <Text style={styles.textBold}>{invoice.contactName || ''}</Text>
                        <Text style={styles.text}>{invoice.contactAddress || ''}</Text>
                        <Text style={styles.text}>
                            {invoice.contactCity ? `${invoice.contactCity}, ` : ''}
                            {invoice.contactState || ''} {invoice.contactZip || ''}
                        </Text>
                        <Text style={styles.text}>{invoice.contactEmail || ''}</Text>
                        <Text style={styles.text}>{invoice.contactPhone || ''}</Text>
                    </View>
                    <View style={styles.detailsRight}>
                        <View style={{marginBottom: 5}}>
                            <Text style={styles.textBold}>Invoice no.</Text>
                            <Text style={styles.text}>{invoice.invoiceNumber || ''}</Text>
                        </View>
                        <View style={{marginBottom: 5}}>
                            <Text style={styles.textBold}>Invoice date</Text>
                            <Text style={styles.text}>{formatDate(invoice.invoiceDate)}</Text>
                        </View>
                        <View>
                            <Text style={styles.textBold}>Due date</Text>
                            <Text style={styles.text}>{formatDate(invoice.dueDate)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableColProduct, styles.tableHeaderText]}>Product/Service</Text>
                        <Text style={[styles.tableColDescription, styles.tableHeaderText]}>Description</Text>
                        <Text style={[styles.tableColQuantity, styles.tableHeaderText]}>Quantity</Text>
                        <Text style={[styles.tableColRate, styles.tableHeaderText]}>Rate</Text>
                        <Text style={[styles.tableColAmount, styles.tableHeaderText]}>Amount</Text>
                    </View>

                    {invoice.items.map((item) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={styles.tableColProduct}>{item.product || ''}</Text>
                            <Text style={styles.tableColDescription}>{item.description || ''}</Text>
                            <Text style={styles.tableColQuantity}>{item.quantity || ''}</Text>
                            <Text style={styles.tableColRate}>{formatCurrency(item.rate || '0')}</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(item.amount || '0')}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.totalsSection}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal</Text>
                        <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal || '0')}</Text>
                    </View>

                    {invoice.salesTaxRate && parseFloat(String(invoice.salesTaxRate)) > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>
                                Tax ({typeof invoice.salesTaxRate === 'string'
                                    ? parseFloat(invoice.salesTaxRate).toFixed(2)
                                    : Number(invoice.salesTaxRate).toFixed(2)}%)
                            </Text>
                            <Text style={styles.totalsValue}>{formatCurrency(invoice.salesTaxAmount || '0')}</Text>
                        </View>
                    )}

                    <View style={styles.totalDueRow}>
                        <Text style={styles.totalDueLabel}>Total</Text>
                        <Text style={styles.totalDueValue}>{formatCurrency(invoice.totalDue || '0')}</Text>
                    </View>
                </View>

                <View style={styles.notesTermsSection}>
                    <View style={styles.notesSection}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.text}>{invoice.notes || ''}</Text>
                    </View>

                    <View style={styles.termsSection}>
                        <Text style={styles.sectionTitle}>Terms</Text>
                        <Text style={styles.text}>{invoice.terms || ''}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Thank you for your business!</Text>
                </View>
            </Page>
        </Document>
    );
};

export default EditorStylePdf;