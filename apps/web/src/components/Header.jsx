
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Activity, BarChart3, Globe, Menu, X, Monitor, LogOut, Ticket, Search, Settings, LayoutDashboard, Users } from 'lucide-react';
import Logo from '@/components/Logo.jsx';

export default function Header() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const NavLinks = () => (
    <>
      {isAuthenticated && (
        <Link to="/" onClick={closeMenu}>
          <Button variant={location.pathname === '/' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
            {t.common.home}
          </Button>
        </Link>
      )}
      <Link to="/create-ticket" onClick={closeMenu}>
        <Button variant={location.pathname === '/create-ticket' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
          <Ticket className="w-4 h-4 mx-1.5" />
          Create Ticket
        </Button>
      </Link>
      <Link to="/track" onClick={closeMenu}>
        <Button variant={location.pathname === '/track' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
          <Search className="w-4 h-4 mx-1.5" />
          Track Status
        </Button>
      </Link>
      <Link to="/display" onClick={closeMenu}>
        <Button variant={location.pathname === '/display' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
          <Monitor className="w-4 h-4 mx-1.5" />
          Display Screen
        </Button>
      </Link>
      {isAuthenticated && (
        <Link to="/counter-monitor" onClick={closeMenu}>
          <Button variant={location.pathname === '/counter-monitor' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
            <Activity className="w-4 h-4 mx-1.5" />
            Counter Monitor
          </Button>
        </Link>
      )}
      {isAuthenticated && !isAdmin && (
        <>
          <Link to="/dashboard" onClick={closeMenu}>
            <Button variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <LayoutDashboard className="w-4 h-4 mx-1.5" />
              Queue Dashboard
            </Button>
          </Link>
          <Link to="/reports" onClick={closeMenu}>
            <Button variant={location.pathname === '/reports' || location.pathname === '/admin/reports' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <BarChart3 className="w-4 h-4 mx-1.5" />
              Reports
            </Button>
          </Link>
          <Link to="/settings" onClick={closeMenu}>
            <Button variant={location.pathname === '/settings' || location.pathname === '/admin/settings' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <Settings className="w-4 h-4 mx-1.5" />
              Settings
            </Button>
          </Link>
        </>
      )}
      {isAdmin && (
        <>
          <Link to="/admin" onClick={closeMenu}>
            <Button variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <LayoutDashboard className="w-4 h-4 mx-1.5" />
              Admin Dashboard
            </Button>
          </Link>
          <Link to="/admin/users" onClick={closeMenu}>
            <Button variant={location.pathname === '/admin/users' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <Users className="w-4 h-4 mx-1.5" />
              Team & Counters
            </Button>
          </Link>
          <Link to="/admin/reports" onClick={closeMenu}>
            <Button variant={location.pathname === '/admin/reports' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <BarChart3 className="w-4 h-4 mx-1.5" />
              Reports
            </Button>
          </Link>
          <Link to="/admin/settings" onClick={closeMenu}>
            <Button variant={location.pathname === '/admin/settings' ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start sm:w-auto sm:justify-center font-semibold text-foreground/80 hover:text-foreground">
              <Settings className="w-4 h-4 mx-1.5" />
              Settings
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        
        <div onClick={closeMenu}>
          <Logo />
        </div>

        <div className="hidden lg:flex flex-1 justify-center">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/40">
            <NavLinks />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle Language" className="interactive-element rounded-xl bg-muted/40 text-foreground hover:bg-muted">
            <span className="font-bold text-sm">{language === 'en' ? 'AR' : 'EN'}</span>
            <Globe className="w-4 h-4 mx-1 opacity-50 hidden xl:block" />
          </Button>

          {isAuthenticated ? (
            <Button onClick={logout} variant="outline" className="shadow-sm rounded-xl font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground border-border/50">
              <LogOut className="w-4 h-4 mx-2" /> Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button className="shadow-lg shadow-primary/20 rounded-xl font-bold interactive-element">
                Staff Login
              </Button>
            </Link>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="interactive-element bg-muted/40 rounded-xl font-bold">
            {language === 'en' ? 'AR' : 'EN'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="interactive-element rounded-xl bg-background">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 py-6 flex flex-col gap-3 shadow-2xl absolute w-full rounded-b-[2rem]">
          <NavLinks />
          <div className="h-px bg-border/50 my-3" />
          {isAuthenticated ? (
            <Button variant="destructive" size="lg" onClick={() => { logout(); closeMenu(); }} className="w-full justify-start rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="w-5 h-5 mx-2" /> Logout
            </Button>
          ) : (
            <Link to="/login" onClick={closeMenu}>
              <Button size="lg" className="w-full justify-center rounded-xl font-bold">Staff Login</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
