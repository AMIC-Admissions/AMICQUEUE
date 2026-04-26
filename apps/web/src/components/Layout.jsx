
import React from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useSyncData } from '@/contexts/SyncContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';

const Layout = ({ children, hideHeader = false, hideFooter = false }) => {
  const { language } = useLanguage();
  const syncData = useSyncData();
  const { currentUser, isAuthenticated } = useAuth();
  
  // Safely check settings
  const settings = Array.isArray(syncData?.settings) && syncData.settings.length > 0 ? syncData.settings[0] : null;
  const backgroundUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'backgroundImage',
    pathField: 'backgroundImagePath',
    fallbackPath: '/assets/amic-site-background.png'
  });

  return (
    <div className="relative min-h-[100dvh] flex flex-col w-full overflow-x-hidden bg-white text-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-35 pointer-events-none"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      
      <div className="fixed inset-0 z-0 bg-white/72 pointer-events-none" />

      {/* Render Header securely using the context inside it */}
      {!hideHeader && <Header />}
      
      <main className="flex-1 relative z-10 flex flex-col w-full max-w-7xl mx-auto py-6 sm:py-8 px-4">
        {/* Render child components - safety checks for missing users are handled inside specific pages */}
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
