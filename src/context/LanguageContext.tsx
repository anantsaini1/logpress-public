import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as RNLocalize from 'react-native-localize';
import { storage } from '../services/storage';
import i18n from '../i18n';

export type LanguageType =
  | 'tr' | 'en' | 'zh' | 'de' | 'fr' | 'id' | 'it' | 'ja' | 'ms' | 'ru' | 'es' | 'hi' | 'ko' | 'pl' | 'th' | 'vi';

export const supportedLanguages: LanguageType[] = [
  'tr', 'en', 'zh', 'de', 'fr', 'id', 'it', 'ja', 'ms', 'ru', 'es', 'hi', 'ko', 'pl', 'th', 'vi',
];

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (language: LanguageType) => void;
  supportedLanguages: LanguageType[];
  getLanguageDisplayName: (code: LanguageType) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const languageDisplayNames: Record<LanguageType, string> = {
  tr: 'Türkçe',
  en: 'English',
  zh: 'Chinese',
  de: 'German',
  fr: 'French',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ms: 'Malay',
  ru: 'Russian',
  es: 'Spanish',
  hi: 'Hindi',
  ko: 'Korean',
  pl: 'Polish',
  th: 'Thai',
  vi: 'Vietnamese',
};

const getDeviceLanguage = (): LanguageType => {
  try {
    const locales = RNLocalize.getLocales();
    let languageCode = 'en';
    if (locales && locales.length > 0) {
      languageCode = locales[0].languageCode;
    }
    if (supportedLanguages.includes(languageCode as LanguageType)) {
      return languageCode as LanguageType;
    } else {
      return 'en';
    }
  } catch (error) {
    console.warn('Cihaz dilini algılarken hata oluştu:', error);
    return 'en';
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>('tr');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await storage.getLanguage();
        if (savedLang && supportedLanguages.includes(savedLang as LanguageType)) {
          setLanguageState(savedLang as LanguageType);
          // i18n dilini de güncelle
          await i18n.changeLanguage(savedLang);
        } else {
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
          // i18n dilini de güncelle
          await i18n.changeLanguage(deviceLang);
        }
      } catch (error) {
        setLanguageState('tr');
        await i18n.changeLanguage('tr');
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: LanguageType) => {
    try {
      await storage.setLanguage(lang);
      setLanguageState(lang);
      // i18n dilini de güncelle
      await i18n.changeLanguage(lang);
    } catch (error) {}
  };

  const getLanguageDisplayName = (code: LanguageType): string => {
    return languageDisplayNames[code] || code;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      supportedLanguages,
      getLanguageDisplayName
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 