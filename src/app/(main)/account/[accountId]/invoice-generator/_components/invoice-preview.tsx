'use client'

import React, { useEffect, useState } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import ThemedEditorStylePdf from './themed-editor-style-pdf'
import { useColorTheme } from '@/providers/color-theme-provider'

type Props = {
    invoiceData: any
}

const InvoicePreview = ({ invoiceData }: Props) => {
    const { colorTheme } = useColorTheme();
    const [mounted, setMounted] = useState(false);
    const [key, setKey] = useState(0); // Add a key to force re-render
    
    // Only execute client-side
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Force re-render when invoiceData changes
    useEffect(() => {
        if (invoiceData) {
            setKey(prevKey => prevKey + 1);
            console.log('Invoice data changed, forcing re-render');
        }
    }, [invoiceData]);
    
    // Don't render anything until mounted (to avoid hydration mismatch)
    if (!mounted || !invoiceData) return null;
    
    // Map FlyonUI themes to theme-colors.ts compatibility
    let mappedTheme = 'default';
    
    // Map FlyonUI themes to our existing theme colors
    switch(colorTheme) {
        case 'light':
            mappedTheme = 'default'; // Use our default (purple) theme
            break;
        case 'dark':
            mappedTheme = 'default'; // Use our default theme in dark mode
            break;
        case 'corporate':
        case 'mintlify':
        case 'shadcn':
            mappedTheme = 'blue';
            break;
        case 'ghibli':
        case 'gourmet':
        case 'valorant':
            mappedTheme = 'red';
            break;
        case 'luxury':
            mappedTheme = 'green';
            break;
        case 'slack':
            mappedTheme = 'pink';
            break;
        case 'soft':
            mappedTheme = 'orange';
            break;
        default:
            mappedTheme = 'default';
    }
    
    // Use the current theme from the color theme provider
    const themedInvoiceData = {
        ...invoiceData,
        theme: mappedTheme
    };
    
    console.log('Final invoice data with color theme:', themedInvoiceData);

    return (
        <div className="w-full h-[600px] overflow-hidden">
            <PDFViewer key={key} width="100%" height="100%" className="border rounded-md">
                <ThemedEditorStylePdf invoice={themedInvoiceData} />
            </PDFViewer>
        </div>
    )
}

export default InvoicePreview