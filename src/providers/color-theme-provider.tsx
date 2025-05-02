"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

type ColorTheme = 'purple' | 'blue' | 'red' | 'yellow' | 'green' | 'orange' | 'pink'

interface ColorThemeContextProps {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextProps | undefined>(undefined)

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('purple')
  const { theme } = useTheme()
  
  // Load saved theme from localStorage on component mount
  useEffect(() => {
    const savedColorTheme = localStorage.getItem('color-theme') as ColorTheme
    if (savedColorTheme) {
      setColorTheme(savedColorTheme)
      document.documentElement.setAttribute('data-color-theme', savedColorTheme)
    }
  }, [])
  
  // Update theme when changed
  const handleThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme)
    localStorage.setItem('color-theme', newTheme)
    document.documentElement.setAttribute('data-color-theme', newTheme)
  }
  
  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme: handleThemeChange }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext)
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider')
  }
  return context
}