import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/providers/theme-provider";
import {ColorThemeProvider} from "@/providers/color-theme-provider";
import ModalProvider from "@/providers/modal-provider";
import {Toaster} from "@/components/ui/sonner";
import Script from "next/script";

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
  // Add script to apply the font family immediately when the page loads
  const initialFontScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('color-theme');
        if (savedTheme) {
          // Apply the saved theme's font family
          const themeFonts = {
            opus: "'Inter', sans-serif",
            opusdark: "'Inter', sans-serif",
            corporate: "'Public Sans', sans-serif",
            ghibli: "'Amaranth', sans-serif",
            gourmet: "'Rubik', sans-serif",
            luxury: "'Archivo', sans-serif",
            mintlify: "'Lato', sans-serif",
            shadcn: "'Montserrat', sans-serif",
            slack: "'Work Sans', sans-serif",
            soft: "'Geist', sans-serif",
            valorant: "'Geist Mono', monospace",
            ocean: "'Poppins', sans-serif",
            forest: "'Merriweather', serif",
            valentine: "'Quicksand', sans-serif",
            synthwave: "'VT323', monospace",
            black: "'Oswald', sans-serif",
            coffee: "'Playfair Display', serif",
            caramellatte: "'Nunito', sans-serif"
          };
          
          const fontFamily = themeFonts[savedTheme];
          if (fontFamily) {
            document.documentElement.style.setProperty('--font-family', fontFamily);
            document.body.style.fontFamily = fontFamily;
          }
        }
      } catch (e) {
        console.error('Error applying initial font:', e);
      }
    })();
  `;

  return (
      <html lang="en" suppressHydrationWarning data-theme="opus">
          <head>
              {/* Required Google Fonts for FlyonUI themes */}
              <link
                href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Amaranth:ital,wght@0,400;0,700;1,400;1,700&display=swap"
                rel="stylesheet"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
                rel="stylesheet"
              />
              <link
                href="https://fonts.googleapis.com/css?family=Archivo:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" 
                rel="stylesheet"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap" 
                rel="stylesheet"
              />
              {/* Additional fonts for theme-specific typography */}
              <link 
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=VT323&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              <link 
                href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap" 
                rel="stylesheet"
              />
              
              {/* Script to apply font family immediately */}
              <script dangerouslySetInnerHTML={{ __html: initialFontScript }} />
          </head>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased theme-font`}>
          <ThemeProvider
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
