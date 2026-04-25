
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings.js';
import pb from '@/lib/pocketbaseClient';
import { getAppPath } from '@/lib/runtimeUrls.js';

const Logo = () => {
  const { settings } = useSettings();
  
  // Handle both uploaded file and text path
  let finalLogoUrl = settings?.logoPath || getAppPath('/assets/amic-logo.svg');
  if (settings?.logoImage) {
    finalLogoUrl = pb.files.getUrl(settings, settings.logoImage);
  }

  return (
    <Link to="/" className="flex items-center gap-3 z-header relative interactive-element shrink-0">
      <img src={finalLogoUrl} alt="AMIC Queue logo" className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-primary/15 bg-white" />
      <span className="font-display font-black text-2xl tracking-tight text-foreground hidden sm:inline drop-shadow-sm">
        AMIC <span className="text-primary">Queue</span>
      </span>
    </Link>
  );
};

export default Logo;
