import React from 'react'
import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer"
import { format } from 'date-fns'
import { Invoice, Account, Contact, BillingAddress, Project } from "@prisma/client"
import { InvoiceItem } from "@/lib/types"

type Props = {
    invoice: Invoice & {
        items?: InvoiceItem[]
        Account?: Account | null
        Contact?: Contact & {
            BillingAddress?: BillingAddress | null
        } | null
        Project?: Project | null
    }
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#FFFFFF'
    },
    section: {
        marginBottom: 10,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    logo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#3B82F6',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 5,
        color: '#4B5563',
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
    addressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    addressBox: {
        width: '45%',
    },
    addressTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1F2937',
    },
    invoiceInfoSection: {
        marginBottom: 20,
    },
    invoiceInfoRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    invoiceInfoLabel: {
        width: '30%',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    invoiceInfoValue: {
        width: '70%',
        fontSize: 10,
        color: '#1F2937',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        borderBottomStyle: 'solid',
        paddingBottom: 5,
        marginBottom: 5,
        backgroundColor: '#F3F4F6',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        borderBottomStyle: 'solid',
        paddingVertical: 8,
    },
    tableCol1: {
        width: '50%',
        fontSize: 10,
        paddingHorizontal: 5,
    },
    tableCol2: {
        width: '15%',
        fontSize: 10,
        textAlign: 'center',
        paddingHorizontal: 5,
    },
    tableCol3: {
        width: '15%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
    },
    tableCol4: {
        width: '20%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    totalSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopStyle: 'solid',
        paddingTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalLabel: {
        width: '20%',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 10,
        color: '#4B5563',
    },
    totalValue: {
        width: '20%',
        fontSize: 10,
        textAlign: 'right',
        paddingHorizontal: 5,
        color: '#1F2937',
    },
    totalDueRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 5,
        backgroundColor: '#F3F4F6',
        padding: 8,
    },
    totalDueLabel: {
        width: '20%',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 10,
        color: '#1F2937',
    },
    totalDueValue: {
        width: '20%',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingHorizontal: 5,
        color: '#3B82F6',
    },
    footer: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopStyle: 'solid',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 3,
    },
    paymentStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
        marginTop: 10,
        textAlign: 'right',
    },
    paidStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
        marginTop: 10,
        textAlign: 'right',
    },
    notesSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopStyle: 'solid',
        paddingTop: 10,
    },
    notesTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1F2937',
    },
    notesText: {
        fontSize: 10,
        color: '#4B5563',
        marginBottom: 10,
    }
});

const InvoicePdf = ({ invoice }: Props) => {
    if (!invoice) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice.currency || 'USD'
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), 'MMM dd, yyyy');
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View>
                        <Text style={styles.logo}>{invoice.Account?.accountName || 'Company Name'}</Text>
                        <Text style={styles.text}>{invoice.Account?.address}</Text>
                        <Text style={styles.text}>{invoice.Account?.city}, {invoice.Account?.state} {invoice.Account?.zipCode}</Text>
                        <Text style={styles.text}>{invoice.Account?.country}</Text>
                        <Text style={styles.text}>{invoice.Account?.accountEmail}</Text>
                        <Text style={styles.text}>{invoice.Account?.accountPhone}</Text>
                    </View>
                    <View>
                        <Text style={styles.title}>INVOICE</Text>
                        <Text style={styles.text}>Invoice #: {invoice.invoiceNumber.toString()}</Text>
                        <Text style={styles.text}>Date: {formatDate(invoice.invoiceDate)}</Text>
                        <Text style={styles.text}>Due Date: {formatDate(invoice.dueDate)}</Text>
                        {invoice.paymentStatus === 'Paid' ? (
                            <Text style={styles.paidStatus}>PAID</Text>
                        ) : (
                            <Text style={styles.paymentStatus}>{invoice.paymentStatus.toUpperCase()}</Text>
                        )}
                    </View>
                </View>

                {/* Client and Billing Information */}
                <View style={styles.addressSection}>
                    <View style={styles.addressBox}>
                        <Text style={styles.addressTitle}>BILL TO:</Text>
                        <Text style={styles.textBold}>{invoice.Contact?.contactName || invoice.Contact?.contactName}</Text>
                        {invoice.Contact?.BillingAddress ? (
                            <>
                                <Text style={styles.text}>{invoice.Contact.BillingAddress.street}</Text>
                                <Text style={styles.text}>
                                    {invoice.Contact.BillingAddress.city}, {invoice.Contact.BillingAddress.state} {invoice.Contact.BillingAddress.zipCode}
                                </Text>
                                <Text style={styles.text}>{invoice.Contact.BillingAddress.country}</Text>
                            </>
                        ) : (
                            <>
                                {invoice.Contact?.BillingAddress?.street && <Text style={styles.text}>{invoice.Contact?.BillingAddress?.street}</Text>}
                                {(invoice.Contact?.BillingAddress?.city || invoice.Contact?.BillingAddress?.state || invoice.Contact?.BillingAddress?.zipCode) && (
                                    <Text style={styles.text}>
                                        {invoice.Contact?.BillingAddress?.city }{invoice.Contact?.BillingAddress?.city  && invoice.Contact?.BillingAddress?.state  ? ', ' : ''}{invoice.Contact?.BillingAddress?.state } {invoice.Contact?.BillingAddress?.zipCode }
                                    </Text>
                                )}
                                {invoice.Contact?.BillingAddress?.country && <Text style={styles.text}>{invoice.Contact?.BillingAddress?.country}</Text>}
                            </>
                        )}
                        <Text style={styles.text}>{invoice.Contact?.contactEmail || invoice.Contact?.contactEmail}</Text>
                        <Text style={styles.text}>{invoice.Contact?.contactPhone || invoice.Contact?.contactPhone}</Text>
                    </View>

                    <View style={styles.addressBox}>
                        <Text style={styles.addressTitle}>PROJECT:</Text>
                        <Text style={styles.textBold}>{invoice.Project?.projectTitle || 'Custom Invoice'}</Text>
                        {invoice.Project?.projectId && <Text style={styles.text}>Project ID: {invoice.Project.projectId}</Text>}
                        {invoice.Project?.status && <Text style={styles.text}>Status: {invoice.Project.status}</Text>}
                    </View>
                </View>

                {/* Invoice Items */}
                <View style={styles.section}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol1, styles.tableHeaderText]}>Description</Text>
                        <Text style={[styles.tableCol2, styles.tableHeaderText]}>Quantity</Text>
                        <Text style={[styles.tableCol3, styles.tableHeaderText]}>Unit Price</Text>
                        <Text style={[styles.tableCol4, styles.tableHeaderText]}>Amount</Text>
                    </View>

                    {invoice.items ? (
                        // Render multiple items if available
                        invoice.items.map((item: InvoiceItem) => (
                            <View key={item.id} style={styles.tableRow}>
                                <Text style={styles.tableCol1}>{item.description || 'Service'}</Text>
                                <Text style={styles.tableCol2}>{item.quantity}</Text>
                                <Text style={styles.tableCol3}>{formatCurrency(parseFloat(item.unitPrice))}</Text>
                                <Text style={styles.tableCol4}>{formatCurrency(parseFloat(item.amount))}</Text>
                            </View>
                        ))
                    ) : (
                        // Fallback to single item
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol1}>
                                {invoice.Project?.projectTitle || 'Project Services'} - {invoice.unitType}
                            </Text>
                            <Text style={styles.tableCol2}>{invoice.quantity}</Text>
                            <Text style={styles.tableCol3}>{formatCurrency(invoice.unitPrice)}</Text>
                            <Text style={styles.tableCol4}>{formatCurrency(invoice.subtotal)}</Text>
                        </View>
                    )}
                </View>

                {/* Totals Section */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                    </View>

                    {invoice.salesTaxRate && invoice.salesTaxAmount && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tax ({invoice.salesTaxRate.toFixed(2)}%):</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.salesTaxAmount)}</Text>
                        </View>
                    )}

                    <View style={styles.totalDueRow}>
                        <Text style={styles.totalDueLabel}>Total Due:</Text>
                        <Text style={styles.totalDueValue}>{formatCurrency(invoice.totalDue)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Thank you for your business! If you have any questions about this invoice,
                        please contact {invoice.Account?.accountEmail || 'us'}.
                    </Text>
                    <Text style={styles.footerText}>
                        This invoice was generated from Opus.io
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;