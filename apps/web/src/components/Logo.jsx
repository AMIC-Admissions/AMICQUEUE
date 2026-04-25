
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings.js';
import pb from '@/lib/pocketbaseClient';

const Logo = () => {
  const { settings } = useSettings();
  
  // Handle both uploaded file and text path
  let finalLogoUrl = settings?.logoPath;
  if (settings?.logoImage) {
    finalLogoUrl = pb.files.getUrl(settings, settings.logoImage);
  }

  return (
    <Link to="/" className="flex items-center space-x-3 z-header relative">
      {finalLogoUrl ? (
        <img src={finalLogoUrl} alt="System Logo" className="h-10 w-auto object-contain drop-shadow-md" />
      ) : (
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-primary-foreground font-bold font-display text-xl">Q</span>
        </div>
      )}
      <span className="font-bold text-xl font-display text-foreground hidden sm:inline drop-shadow-sm">
        {settings?.systemTitle || 'QueueFlow'}
      </span>
    </Link>
  );
};

export default Logo;
