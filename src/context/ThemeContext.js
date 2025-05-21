import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

// Definimos los colores utilizando la regla 60-30-10
// 60% color primario, 30% color secundario, 10% color de acento
const themeColors = {
  light: {
    // 60% - Color base (azul claro/blanco)
    primary: '#F5F9FC',
    background: '#FFFFFF',
    card: '#F0F7FF',

    // 30% - Color secundario (azul medio)
    secondary: '#4DA1FF',
    secondaryLight: '#E1EFFF',

    // 10% - Color de acento (azul oscuro)
    accent: '#0055CC',

    // Colores funcionales
    text: '#333333',
    subtext: '#666666',
    border: '#E0E0E0',
    error: '#FF4D4D',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
  },
  dark: {
    // 60% - Color base (azul oscuro/negro)
    primary: '#1A2938',
    background: '#0F1924',
    card: '#253545',

    // 30% - Color secundario (azul medio/oscuro)
    secondary: '#2C5282',
    secondaryLight: '#37628F',

    // 10% - Color de acento (azul claro)
    accent: '#63B3ED',

    // Colores funcionales
    text: '#F0F7FF',
    subtext: '#CBD5E0',
    border: '#2D3748',
    error: '#FF6B6B',
    success: '#68D391',
    warning: '#F6E05E',
    info: '#63B3ED',
  },
};

export const ThemeProvider = ({ children }) => {
  // Detectar el tema del sistema
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [colors, setColors] = useState(themeColors.light);

  // Actualizar el tema cuando cambia el tema del sistema
  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme);
      setColors(themeColors[colorScheme]);
    }
  }, [colorScheme]);

  // Cambiar tema manualmente
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setColors(themeColors[newTheme]);
  };

  const value = {
    theme,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
