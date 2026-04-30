import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { storage } from '../services/storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  currentTheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryDisabled: string;
    error: string;
    errorDisabled: string;
    border: string;
    card: string;
    cardBorder: string;
    cardAlt: string;
    success: string;
    divider: string;
    placeholder: string;
    icon: string;
    headerBackground: string;
    headerText: string;
    buttonText: string;
    cardText: string;
    tabBar: string;
    tabBarInactive: string;
    tabBarActive: string;
    tabBarBorder: string;
    genderMale: string;
    genderFemale: string;
  };
}

// Modern renk paleti
export const lightColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#F43F5E',
  primaryDisabled: '#C7D2FE',
  error: '#EF4444',
  errorDisabled: '#FCA5A5',
  border: '#E5E7EB',
  card: '#FFFFFF',
  cardBorder: '#F3F4F6',
  cardAlt: '#F9FAFB',
  success: '#10B981',
  divider: '#E5E7EB',
  placeholder: '#9CA3AF',
  icon: '#6B7280',
  headerBackground: '#FFFFFF',
  headerText: '#111827',
  buttonText: '#FFFFFF',
  cardText: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarInactive: '#6B7280',
  tabBarActive: '#F43F5E',
  tabBarBorder: '#E5E7EB',
  genderMale: '#3B82F6',
  genderFemale: '#F43F5E'
};

export const darkColors = {
  background: '#1C1C1E',
  surface: '#27272A',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  primary: '#F43F5E',
  primaryDisabled: '#881337',
  error: '#EF4444',
  errorDisabled: '#7F1D1D',
  border: '#3F3F46',
  card: '#27272A',
  cardBorder: '#3F3F46',
  cardAlt: '#2D2D30',
  success: '#10B981',
  divider: '#3F3F46',
  placeholder: '#71717A',
  icon: '#FAFAFA',
  headerBackground: '#1C1C1E',
  headerText: '#FAFAFA',
  buttonText: '#FFFFFF',
  cardText: '#FFFFFF',
  tabBar: '#27272A',
  tabBarInactive: '#71717A',
  tabBarActive: '#F43F5E',
  tabBarBorder: '#3F3F46',
  genderMale: '#60A5FA',
  genderFemale: '#F43F5E'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.getTheme();
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Tema yüklenirken hata:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await storage.setTheme(newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Tema kaydedilirken hata:', error);
    }
  };

  // Aktif temayı belirle
  const currentTheme = theme === 'system' 
    ? (systemColorScheme || 'light') 
    : theme;

  // Aktif tema renklerini belirle
  const colors = currentTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Stil oluşturmak için yardımcı fonksiyon
export const createThemedStyle = (lightStyle: any, darkStyle: any) => {
  return (isDark: boolean) => {
    return isDark ? { ...lightStyle, ...darkStyle } : lightStyle;
  };
}; 