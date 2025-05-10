"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTheme } from "next-themes";

export type ColorTheme =
  | "opus"
  | "opusdark"
  | "corporate"
  | "ghibli"
  | "gourmet"
  | "luxury"
  | "mintlify"
  | "shadcn"
  | "slack"
  | "soft"
  | "valorant"
  | "ocean"
  | "forest"
  | "valentine"
  | "synthwave"
  | "black"
  | "coffee"
  | "caramellatte";

const themeFonts: Record<ColorTheme, string> = {
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
  caramellatte: "'Nunito', sans-serif",
};

interface ColorThemeContextProps {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextProps | undefined>(
  undefined
);

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to 'opus' theme if no saved theme is found
  const [colorTheme, setColorTheme] = useState<ColorTheme>("opus");
  const { setTheme } = useTheme();

  // Apply the theme to the HTML element
  const applyTheme = useCallback(
    (themeValue: ColorTheme) => {
      // Set the FlyonUI theme using data-theme attribute
      document.documentElement.setAttribute("data-theme", themeValue);

      // Apply the font family for the selected theme
      const fontFamily = themeFonts[themeValue];
      if (fontFamily) {
        document.documentElement.style.setProperty("--font-family", fontFamily);
        // Also apply it directly to the body for immediate effect
        document.body.style.fontFamily = fontFamily;
      }

      // Update the next-themes provider based on color scheme
      // Dark themes should use dark mode, light themes should use light mode
      const darkThemes = [
        "opusdark",
        "dark",
        "shadcn",
        "synthwave",
        "black",
        "coffee",
      ];
      if (darkThemes.includes(themeValue)) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    },
    [setTheme]
  );

  // Load saved theme from localStorage on component mount
  useEffect(() => {
    const savedColorTheme = localStorage.getItem("color-theme") as ColorTheme;
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
      applyTheme(savedColorTheme);
    } else {
      // If no saved theme, apply the default 'opus' theme
      applyTheme("opus");
    }
  }, [setTheme, applyTheme]);

  // Update theme when changed
  const handleThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
    localStorage.setItem("color-theme", newTheme);
    applyTheme(newTheme);
    console.log("Theme changed to:", newTheme);
  };

  return (
    <ColorThemeContext.Provider
      value={{ colorTheme, setColorTheme: handleThemeChange }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
}

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
};
