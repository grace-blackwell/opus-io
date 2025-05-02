import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/providers/theme-provider";
import {ColorThemeProvider} from "@/providers/color-theme-provider";
import ModalProvider from "@/providers/modal-provider";
import {Toaster} from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opus",
  description: "All-in-one Freelancer Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
              <ColorThemeProvider>
                  <ModalProvider>
                      {children}
                      <Toaster />
                  </ModalProvider>
              </ColorThemeProvider>
          </ThemeProvider>
          </body>
      </html>

  );
}
