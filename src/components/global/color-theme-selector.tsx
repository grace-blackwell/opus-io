"use client";

import React from "react";
import {
  useColorTheme,
  type ColorTheme,
} from "@/providers/color-theme-provider";
import { Check } from "lucide-react";
import { themeChange } from "theme-change";
themeChange();

type ColorThemeOption = {
  value: ColorTheme;
  label: string;
  color: string;
  // These colors are used for the theme preview
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  fontFamily: string;
};

const colorThemeOptions: ColorThemeOption[] = [
  {
    value: "opus",
    label: "Opus",
    color: "#C4B3FFFF",
    primaryColor: "#C4B3FF",
    backgroundColor: "#FFFFFF",
    textColor: "#333333",
    secondaryColor: "#FFD166",
    fontFamily: "'Inter', sans-serif",
  },
  {
    value: "opusdark",
    label: "Opus Dark",
    color: "#3C0366FF",
    primaryColor: "#4A1A8B",
    backgroundColor: "#222222FF",
    textColor: "#EBEBEB",
    secondaryColor: "#FFB347",
    fontFamily: "'Inter', sans-serif",
  },
  {
    value: "corporate",
    label: "Corporate",
    color: "#4b6cb7",
    primaryColor: "#4b6cb7",
    backgroundColor: "#fdfdfe",
    textColor: "#334155",
    secondaryColor: "#64748b",
    fontFamily: "'Public Sans', sans-serif",
  },
  {
    value: "ghibli",
    label: "Ghibli",
    color: "#7c8045",
    primaryColor: "#7c8045",
    backgroundColor: "#f2e7d3",
    textColor: "#4A4A4A",
    secondaryColor: "#3b4a5f",
    fontFamily: "'Amaranth', sans-serif",
  },
  {
    value: "gourmet",
    label: "Gourmet",
    color: "#f9661e",
    primaryColor: "#f9661e",
    backgroundColor: "#fefdfb",
    textColor: "#3D2C29",
    secondaryColor: "#6b6673",
    fontFamily: "'Rubik', sans-serif",
  },
  {
    value: "luxury",
    label: "Luxury",
    color: "#bb8251",
    primaryColor: "#bb8251",
    backgroundColor: "#251d16",
    textColor: "#e9d5c1",
    secondaryColor: "#A8A29E",
    fontFamily: "'Archivo', sans-serif",
  },
  {
    value: "mintlify",
    label: "Mintlify",
    color: "#16a34a",
    primaryColor: "#16a34a",
    backgroundColor: "#F0FDF4",
    textColor: "#166534",
    secondaryColor: "#ffb625",
    fontFamily: "'Lato', sans-serif",
  },
  {
    value: "shadcn",
    label: "Shadcn",
    color: "#232325",
    primaryColor: "#232325",
    backgroundColor: "#FFFFFF",
    textColor: "#171719",
    secondaryColor: "#6b6673",
    fontFamily: "'Montserrat', sans-serif",
  },
  {
    value: "slack",
    label: "Slack",
    color: "#411541",
    primaryColor: "#411541",
    backgroundColor: "#f5f5f5",
    textColor: "#4A154B",
    secondaryColor: "#000000",
    fontFamily: "'Work Sans', sans-serif",
  },
  {
    value: "soft",
    label: "Soft",
    color: "#9e4cf2",
    primaryColor: "#9e4cf2",
    backgroundColor: "#fbf9ff",
    textColor: "#4C1D95",
    secondaryColor: "#6b6673",
    fontFamily: "'Geist', sans-serif",
  },
  {
    value: "valorant",
    label: "Valorant",
    color: "#ff3b4b",
    primaryColor: "#ff3b4b",
    backgroundColor: "#fffafc",
    textColor: "#191716",
    secondaryColor: "#292929",
    fontFamily: "'Geist Mono', monospace",
  },
  {
    value: "ocean",
    label: "Ocean",
    color: "#0094a5",
    primaryColor: "#0094a5",
    backgroundColor: "#eff9fd",
    textColor: "#0C4A6E",
    secondaryColor: "#00b499",
    fontFamily: "'Poppins', sans-serif",
  },
  {
    value: "forest",
    label: "Forest",
    color: "#497613",
    primaryColor: "#497613",
    backgroundColor: "#f3f9f2",
    textColor: "#065F46",
    secondaryColor: "#898a32",
    fontFamily: "'Merriweather', serif",
  },
  {
    value: "valentine",
    label: "Valentine",
    color: "#f3278d",
    primaryColor: "#f3278d",
    backgroundColor: "#fceff6",
    textColor: "#9F1239",
    secondaryColor: "#a13dff",
    fontFamily: "'Quicksand', sans-serif",
  },
  {
    value: "synthwave",
    label: "Synthwave",
    color: "#1e4d92",
    primaryColor: "#ff61d8",
    backgroundColor: "#2D1B69",
    textColor: "#FFFFFF",
    secondaryColor: "#36B9CC",
    fontFamily: "'VT323', monospace",
  },
  {
    value: "black",
    label: "Black",
    color: "#000000",
    primaryColor: "#333333",
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    secondaryColor: "#444444",
    fontFamily: "'Oswald', sans-serif",
  },
  {
    value: "coffee",
    label: "Coffee",
    color: "#4b2700",
    primaryColor: "#B87333",
    backgroundColor: "#221a21",
    textColor: "#E6CCB3",
    secondaryColor: "#223637",
    fontFamily: "'Playfair Display', serif",
  },
  {
    value: "caramellatte",
    label: "Caramel Latte",
    color: "#000000",
    primaryColor: "#000000",
    backgroundColor: "#FAF3E0",
    textColor: "#5D4037",
    secondaryColor: "#300c02",
    fontFamily: "'Nunito', sans-serif",
  },
];

export function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="w-full max-h-[300px] overflow-y-auto p-1">
      <div className="grid grid-cols-1 gap-3">
        {colorThemeOptions.map((option) => {
          const isSelected = option.value === colorTheme;

          return (
            <div
              key={option.value}
              onClick={() => setColorTheme(option.value as ColorTheme)}
              className={`relative rounded-md overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? "ring-2 ring-primary"
                  : "hover:ring-1 hover:ring-primary/50"
              }`}
              style={{
                backgroundColor: option.backgroundColor,
              }}
            >
              {/* Theme preview card */}
              <div className="p-3">
                {/* Header with theme name and selected indicator */}
                <div
                  className="flex items-center justify-between mb-2"
                  style={{ fontFamily: option.fontFamily }}
                >
                  <span
                    className="font-medium text-sm"
                    style={{ color: option.textColor }}
                  >
                    {option.label}
                  </span>

                  {isSelected && (
                    <div
                      className="rounded-full p-0.5"
                      style={{ backgroundColor: option.primaryColor }}
                    >
                      <Check
                        className="h-3 w-3"
                        style={{ color: option.backgroundColor }}
                      />
                    </div>
                  )}
                </div>

                {/* Theme color samples */}
                <div className="flex gap-1.5 mt-1">
                  {/* Primary button */}
                  <div
                    className="h-5 flex-1 rounded-sm flex items-center justify-center text-[10px] font-medium"
                    style={{
                      backgroundColor: option.primaryColor,
                      color: option.backgroundColor,
                    }}
                  ></div>

                  {/* Secondary button */}
                  <div
                    className="h-5 flex-1 rounded-sm flex items-center justify-center text-[10px] font-medium"
                    style={{
                      backgroundColor: option.secondaryColor,
                      color: option.backgroundColor,
                    }}
                  ></div>
                </div>

                {/* Text sample */}
                <div
                  className="mt-2 text-[10px] leading-tight"
                  style={{ color: option.textColor }}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-1"
                    style={{ backgroundColor: `${option.textColor}20` }}
                  ></div>
                  <div
                    className="w-3/4 h-1.5 rounded-full"
                    style={{ backgroundColor: `${option.textColor}20` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
