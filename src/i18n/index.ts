import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './tr.json';
import en from './en.json';
import zh from './zh.json';
import de from './de.json';
import fr from './fr.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import ms from './ms.json';
import ru from './ru.json';
import es from './es.json';
import hi from './hi.json';
import ko from './ko.json';
import pl from './pl.json';
import th from './th.json';
import vi from './vi.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  zh: { translation: zh },
  de: { translation: de },
  fr: { translation: fr },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ms: { translation: ms },
  ru: { translation: ru },
  es: { translation: es },
  hi: { translation: hi },
  ko: { translation: ko },
  pl: { translation: pl },
  th: { translation: th },
  vi: { translation: vi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // Varsayılan dil
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react zaten escape ediyor
    },
  });

export default i18n; 