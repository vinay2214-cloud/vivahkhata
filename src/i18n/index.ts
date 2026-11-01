import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import te from './te.json';
import hi from './hi.json';

export type AppLanguage = 'en' | 'te' | 'hi';
export const LANGUAGE_LABEL: Record<AppLanguage, string> = { en: 'English', te: 'తెలుగు', hi: 'हिन्दी' };
const ORDER: AppLanguage[] = ['en', 'te', 'hi'];

export const asAppLanguage = (value: string | null | undefined): AppLanguage =>
  (ORDER as string[]).includes(value || '') ? (value as AppLanguage) : 'en';
/** The language after this one in the cycle English → తెలుగు → हिन्दी → English. */
export const nextLanguage = (current: string | null | undefined): AppLanguage =>
  ORDER[(ORDER.indexOf(asAppLanguage(current)) + 1) % ORDER.length];

function readSavedLanguage(): AppLanguage {
  try {
    return asAppLanguage(localStorage.getItem('vk_language'));
  } catch {
    return 'en'; // storage blocked (private window) or not available
  }
}
const savedLang = readSavedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== 'undefined') document.documentElement.lang = savedLang;

export function switchLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem('vk_language', lang);
  } catch {
    /* ignore: language still switches for this visit */
  }
  document.documentElement.lang = lang;
}

export default i18n;
