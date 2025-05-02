
export const themeColors = {

  default: {
    background: 'hsl(288 30% 98%)',
    foreground: 'hsl(288 50% 10%)',
    muted: 'hsl(288 20% 90%)',
    mutedForeground: 'hsl(288 10% 40%)',
    primary: 'rgba(167, 28, 202, 1)',
    primaryForeground: 'hsl(288 10% 98%)',
    secondary: 'rgba(255, 165, 0, 1)',
    secondaryForeground: 'hsl(288 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(288 20% 85%)',
  },

  blue: {
    background: 'hsl(210 30% 98%)',
    foreground: 'hsl(210 50% 10%)',
    muted: 'hsl(210 20% 90%)',
    mutedForeground: 'hsl(210 10% 40%)',
    primary: '#1A73E8FF',
    primaryForeground: 'hsl(210 10% 98%)',
    secondary: '#FF8C00',
    secondaryForeground: 'hsl(210 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(210 20% 85%)',
  },

  red: {
    background: 'hsl(0 30% 98%)',
    foreground: 'hsl(0 50% 10%)',
    muted: 'hsl(0 20% 90%)',
    mutedForeground: 'hsl(0 10% 40%)',
    primary: 'rgba(229, 57, 53, 1)',
    primaryForeground: 'hsl(0 10% 98%)',
    secondary: 'rgba(26, 202, 186, 1)',
    secondaryForeground: 'hsl(0 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(0 20% 85%)',
  },

  green: {
    background: 'hsl(120 30% 98%)',
    foreground: 'hsl(120 50% 10%)',
    muted: 'hsl(120 20% 90%)',
    mutedForeground: 'hsl(120 10% 40%)',
    primary: '#4caf50',
    primaryForeground: 'hsl(120 10% 98%)',
    secondary: 'rgba(255, 165, 0, 1)',
    secondaryForeground: 'hsl(120 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(120 20% 85%)',
  },

  orange: {
    background: 'hsl(30 30% 98%)',
    foreground: 'hsl(30 50% 10%)',
    muted: 'hsl(30 20% 90%)',
    mutedForeground: 'hsl(30 10% 40%)',
    primary: '#ff9800',
    primaryForeground: 'hsl(30 10% 98%)',
    secondary: '#2196f3',
    secondaryForeground: 'hsl(30 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(30 20% 85%)',
  },

  pink: {
    background: 'hsl(330 30% 98%)',
    foreground: 'hsl(330 50% 10%)',
    muted: 'hsl(330 20% 90%)',
    mutedForeground: 'hsl(330 10% 40%)',
    primary: 'rgba(233, 30, 99, 1)',
    primaryForeground: 'hsl(330 10% 98%)',
    secondary: 'rgba(225, 64, 169, 1)',
    secondaryForeground: 'hsl(330 10% 98%)',
    destructive: 'rgba(247, 74, 74, 1)',
    border: 'hsl(330 20% 85%)',
  },
};

export const getThemeColors = (theme: string) => {
  console.log('getThemeColors called with theme:', theme);
  const colors = themeColors[theme as keyof typeof themeColors] || themeColors.default;
  console.log('Returning colors for theme:', theme, colors.primary);
  return colors;
};