
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';

export const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="font-bold uppercase rounded-xl transition-all w-16"
    >
      {language === 'en' ? 'عربي' : 'EN'}
    </Button>
  );
};
