
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Layers } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-card/90 backdrop-blur-xl border-t border-border/50 py-8 mt-auto">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-display font-black text-lg text-foreground">AMIC Queue</h3>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/create-ticket" className="hover:text-foreground transition-colors">Create Ticket</Link>
            <Link to="/track" className="hover:text-foreground transition-colors">Tracking</Link>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AMIC Queue Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
