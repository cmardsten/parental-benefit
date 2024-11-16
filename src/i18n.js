import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import sv from './locales/sv.json';

const messages = {
  en,
  sv,
};

const savedLocale = localStorage.getItem('locale') || 'sv';
const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
});

export default i18n;