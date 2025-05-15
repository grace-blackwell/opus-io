"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { InvoiceData } from "./themed-editor-style-pdf";
import { useColorTheme } from "@/providers/color-theme-provider";

// Dynamically import PDFPreview with no SSR to avoid hydration issues
const PDFPreview = dynamic(() => import("./pdf-preview"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <p>Loading PDF viewer...</p>
    </div>
  ),
});

type Props = {
  invoiceData: InvoiceData;
};

// Map FlyonUI themes to theme-colors.ts compatibility
const mapTheme = (colorTheme: string): string => {
  switch (colorTheme) {
    case "opus":
    case "opusdark":
      return "default";
    case "corporate":
    case "mintlify":
    case "shadcn":
    case "ocean":
      return "blue";
    case "ghibli":
    case "gourmet":
    case "valorant":
      return "red";
    case "luxury":
    case "forest":
      return "green";
    case "slack":
    case "valentine":
      return "pink";
    case "soft":
    case "caramellatte":
      return "orange";
    case "synthwave":
    case "black":
    case "coffee":
      return "default"; // Dark themes use default
    default:
      return "default";
  }
};

const InvoicePreview = ({ invoiceData }: Props) => {
  const { colorTheme } = useColorTheme();
  const [mounted, setMounted] = useState(false);

  // Only execute client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (to avoid hydration mismatch)
  if (!mounted || !invoiceData) return null;

  // Map the theme
  const mappedTheme = mapTheme(colorTheme);

  // Create the themed invoice data
  const themedInvoiceData = {
    ...invoiceData,
    theme: mappedTheme,
  };

  return (
    <div className="w-full h-[600px] overflow-hidden">
      <PDFPreview invoiceData={themedInvoiceData} />
    </div>
  );
};

export default InvoicePreview;
