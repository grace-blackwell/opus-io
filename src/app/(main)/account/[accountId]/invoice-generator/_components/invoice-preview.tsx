'use client'

import React from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import InvoicePdf from '@/app/(main)/account/[accountId]/invoices/_components/invoice-pdf'

type Props = {
    invoiceData: any
}

const InvoicePreview = ({ invoiceData }: Props) => {
    if (!invoiceData) return null

    return (
        <div className="w-full h-[600px] overflow-hidden">
            <PDFViewer width="100%" height="100%" className="border rounded-md">
                <InvoicePdf invoice={invoiceData} />
            </PDFViewer>
        </div>
    )
}

export default InvoicePreview