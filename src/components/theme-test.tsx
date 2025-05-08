'use client'

import React from 'react'
import { useColorTheme } from '@/providers/color-theme-provider'

export function ThemeTest() {
  const { colorTheme } = useColorTheme()
  
  return (
    <div className="p-4 rounded-lg bg-background border border-border">
      <h2 className="text-xl font-bold text-foreground mb-4">Theme Test Component</h2>
      <p className="text-foreground mb-2">Current theme: <span className="font-bold">{colorTheme}</span></p>
      
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="p-3 bg-primary text-primary-foreground rounded">Primary</div>
        <div className="p-3 bg-secondary text-secondary-foreground rounded">Secondary</div>
        <div className="p-3 bg-muted text-muted-foreground rounded">Muted</div>
        <div className="p-3 bg-destructive text-destructive-foreground rounded">Destructive</div>
      </div>
    </div>
  )
}