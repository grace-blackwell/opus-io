import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Public_Sans,
  Amaranth,
  Rubik,
  Archivo,
  Lato,
  Montserrat,
  Work_Sans,
  Roboto_Mono,
  Poppins,
  Merriweather,
  Quicksand,
  VT323,
  Oswald,
  Playfair_Display,
  Nunito,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ColorThemeProvider } from "@/providers/color-theme-provider";
import ModalProvider from "@/providers/modal-provider";
import { Toaster } from "@/components/ui/sonner";

// Load all fonts with next/font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const amaranth = Amaranth({
  variable: "--font-amaranth",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
          // Apply the saved theme's font family using CSS variables
          const themeFontVariables = {
            opus: "var(--font-inter)",
            opusdark: "var(--font-inter)",
            corporate: "var(--font-public-sans)",
            ghibli: "var(--font-amaranth)",
            gourmet: "var(--font-rubik)",
            luxury: "var(--font-archivo)",
            mintlify: "var(--font-lato)",
            shadcn: "var(--font-montserrat)",
            slack: "var(--font-work-sans)",
            soft: "var(--font-geist-sans)",
            valorant: "var(--font-geist-mono)",
            ocean: "var(--font-poppins)",
            forest: "var(--font-merriweather)",
            valentine: "var(--font-quicksand)",
            synthwave: "var(--font-vt323)",
            black: "var(--font-oswald)",
            coffee: "var(--font-playfair-display)",
            caramellatte: "var(--font-nunito)"
          };
          const fontVariable = themeFontVariables[savedTheme];
          if (fontVariable) {
            document.documentElement.style.setProperty('--font-family', fontVariable);
            document.body.style.fontFamily = fontVariable;
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
        {/* Script to apply font family immediately */}
        <script dangerouslySetInnerHTML={{ __html: initialFontScript }} />
      </head>
      <body
        className={`
            ${geistSans.variable}
            ${geistMono.variable}
            ${inter.variable}
            ${publicSans.variable}
            ${amaranth.variable}
            ${rubik.variable}
            ${archivo.variable}
            ${lato.variable}
            ${montserrat.variable}
            ${workSans.variable}
            ${robotoMono.variable}
            ${poppins.variable}
            ${merriweather.variable}
            ${quicksand.variable}
            ${vt323.variable}
            ${oswald.variable}
            ${playfairDisplay.variable}
            ${nunito.variable}
            antialiased theme-font
          `}
      >
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
