
import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext.jsx';
import { translations } from '@/translations.js';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? 'en';
  return translations?.[language] ?? translations?.en ?? {};
};
