
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings.js';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';

const Logo = ({ imageClassName = '' }) => {
  const { settings } = useSettings();
  const finalLogoUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'logoImage',
    pathField: 'logoPath',
    fallbackPath: '/assets/amic-logo.png'
  });

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
