
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings.js';
import pb from '@/lib/pocketbaseClient';
import { getAppPath } from '@/lib/runtimeUrls.js';

const Logo = ({ imageClassName = '' }) => {
  const { settings } = useSettings();
  
  // Handle both uploaded file and text path
  let finalLogoUrl = settings?.logoPath || getAppPath('/assets/amic-logo.jpg');
  if (settings?.logoImage) {
    finalLogoUrl = pb.files.getUrl(settings, settings.logoImage);
  }

  return (
    <Link to="/" className="flex items-center z-header relative interactive-element shrink-0" aria-label="AMIC Queue home">
      <img
        src={finalLogoUrl}
        alt="Ajyal Al Marefa, AMIC, and Kids Gate logos"
        className={`w-[180px] sm:w-[260px] lg:w-[220px] xl:w-[340px] h-auto object-contain ${imageClassName}`}
      />
    </Link>
  );
};

export default Logo;
