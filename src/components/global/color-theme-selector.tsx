'use client'

import React from 'react'
import { useColorTheme } from '@/providers/color-theme-provider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

type ColorThemeOption = {
  value: string
  label: string
  color: string
}

const colorThemeOptions: ColorThemeOption[] = [
  { value: 'purple', label: 'Purple', color: '#BE2CE2' },
  { value: 'blue', label: 'Blue', color: '#4285f4' },
  { value: 'red', label: 'Red', color: '#f44336' },
  { value: 'yellow', label: 'Yellow', color: '#ffeb3b' },
  { value: 'green', label: 'Green', color: '#66bb6a' },
  { value: 'orange', label: 'Orange', color: '#ff9800' },
  { value: 'pink', label: 'Pink', color: '#ec407a' },
]

export function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()

  return (
    <div className="w-full px-4 py-2">
      <RadioGroup
        value={colorTheme}
        onValueChange={(value) => setColorTheme(value as any)}
        className="grid grid-cols-1 gap-4"
      >
        {colorThemeOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-3">
            <RadioGroupItem value={option.value} id={`theme-${option.value}`} />
            <Label htmlFor={`theme-${option.value}`} className="flex items-center gap-2 cursor-pointer">
              <div 
                className="w-5 h-5 rounded-full border border-border" 
                style={{ backgroundColor: option.color }}
              />
              <span>{option.label}</span>
              {option.value === colorTheme && <span className="text-xs text-muted-foreground">(Current)</span>}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}