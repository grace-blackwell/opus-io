"use client";

import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ThemedEditorStylePdf, { InvoiceData } from "./themed-editor-style-pdf";

type Props = {
  invoiceData: InvoiceData;
};

// This component is dynamically imported with no SSR to avoid hydration issues
const PDFPreview = ({ invoiceData }: Props) => {
  if (!invoiceData) return null;

  return (
    <PDFViewer width="100%" height="100%" className="border rounded-md">
      <ThemedEditorStylePdf invoice={invoiceData} />
    </PDFViewer>
  );
};

export default PDFPreview;
