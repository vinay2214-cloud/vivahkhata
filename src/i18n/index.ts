import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import te from './te.json';

const savedLang = localStorage.getItem('vk_language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function switchLanguage(lang: 'en' | 'te') {
  i18n.changeLanguage(lang);
  localStorage.setItem('vk_language', lang);
  document.documentElement.lang = lang;
}

export default i18n;
