
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const QRCodeDisplay = ({ value, size = 200, className, showDownload = false, labelEn = 'Scan to track', labelAr = 'امسح للتتبع' }) => {
  const t = useTranslation();
  const { language } = useLanguage();
  const svgRef = useRef(null);

  const handleDownload = () => {
    const svgNode = svgRef.current;
    if (!svgNode) return;
    
    const svgData = new XMLSerializer().serializeToString(svgNode);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-qr-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!value) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 rounded-[2rem] border-4 border-dashed border-border/50 p-8 ${className || ''}`} style={{ width: size + 64, height: size + 64 }}>
        <p className="text-muted-foreground font-medium text-center">QR Code Unavailable</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-5 p-8 bg-white rounded-[2rem] border-4 border-primary/10 shadow-xl ${className || ''}`}>
      <p className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
        {language === 'ar' ? labelAr : labelEn}
      </p>
      <div className="bg-white p-2 rounded-xl">
        <QRCodeSVG 
          value={value} 
          size={size} 
          level="H" 
          ref={svgRef} 
          includeMargin={true}
        />
      </div>
      {showDownload && (
        <Button variant="outline" size="sm" onClick={handleDownload} className="font-bold text-slate-600 hover:text-slate-900 border-slate-200 w-full">
          <Download className="w-4 h-4 mr-2" /> {t?.common?.download || 'Download QR'}
        </Button>
      )}
    </div>
  );
};

export default QRCodeDisplay;
