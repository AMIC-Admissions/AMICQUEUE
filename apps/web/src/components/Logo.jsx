
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings.js';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';
import { getAppPath } from '@/lib/runtimeUrls.js';

const Logo = ({ imageClassName = '' }) => {
  const { settings } = useSettings();
  const resolvedLogoUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'logoImage',
    pathField: 'logoPath',
    fallbackPath: '/assets/amic-logo.png'
  });
  const logoCandidates = React.useMemo(() => {
    const candidates = [
      resolvedLogoUrl,
      getAppPath('/assets/amic-logo.png'),
      getAppPath('/assets/amic-logo.jpg'),
      getAppPath('/assets/amic-logo.svg')
    ].filter(Boolean);

    return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
  }, [resolvedLogoUrl]);
  const [logoIndex, setLogoIndex] = React.useState(0);

  React.useEffect(() => {
    setLogoIndex(0);
  }, [resolvedLogoUrl]);

  return (
    <Link to="/" className="flex items-center z-header relative interactive-element shrink-0" aria-label="AMIC Queue home">
      <img
        src={logoCandidates[Math.min(logoIndex, logoCandidates.length - 1)]}
        alt="Ajyal Al Marefa, AMIC, and Kids Gate logos"
        className={`w-[180px] sm:w-[260px] lg:w-[220px] xl:w-[340px] h-auto object-contain ${imageClassName}`}
        onError={() => {
          setLogoIndex((current) => Math.min(current + 1, logoCandidates.length - 1));
        }}
      />
    </Link>
  );
};

export default Logo;
