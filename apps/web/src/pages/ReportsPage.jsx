
import React from 'react';
import { Helmet } from 'react-helmet';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { translations } from '@/translations.js';

const ReportsPage = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{`${t?.admin?.reports ?? 'Reports'} - AMIC Queue Management`}</title></Helmet>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-display font-black">{t?.admin?.reports ?? 'Reports'}</h1>
      </div>

      <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-8 text-center text-muted-foreground">
        Reports and Excel export coming soon.
      </div>
    </div>
  );
};

export default ReportsPage;
