
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, ClipboardList, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTranslation } from '@/hooks/useTranslation.js';

export const RoleBasedNavigation = ({ mobile = false, onClick }) => {
  const auth = useAuth();
  const isAdmin = auth?.isAdmin ?? false;
  const isStaff = auth?.isStaff ?? false;
  
  const location = useLocation();
  const pathname = location?.pathname ?? '';
  
  const t = useTranslation() ?? {};

  const isActive = (path) => {
    if (!path || !pathname) return false;
    if (path === '/admin' && pathname !== '/admin') return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkClass = mobile 
    ? "block px-4 py-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
    : "text-sm font-bold transition-colors flex items-center hover:text-primary";

  const activeClass = mobile ? "bg-muted text-primary" : "text-primary";
  const inactiveClass = mobile ? "text-foreground" : "text-foreground/80";

  const getClasses = (path) => `${linkClass} ${isActive(path) ? activeClass : inactiveClass}`;

  return (
    <>
      {isStaff && (
        <Link to="/dashboard" onClick={onClick} className={getClasses('/dashboard')}>
          <LayoutDashboard className="w-4 h-4 me-1.5" /> {t?.nav?.dashboard ?? 'Dashboard'}
        </Link>
      )}

      {isAdmin && (
        <>
          {mobile && (
            <div className="pt-2 pb-2 border-y border-border/50 my-2">
              <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t?.nav?.adminMenu ?? 'Admin Menu'}
              </p>
            </div>
          )}
          <Link to="/admin" onClick={onClick} className={getClasses('/admin')}>
            <LayoutDashboard className="w-4 h-4 me-1.5" /> {t?.nav?.admin ?? 'Admin'}
          </Link>
          <Link to="/admin/users" onClick={onClick} className={getClasses('/admin/users')}>
            <Users className="w-4 h-4 me-1.5" /> {t?.nav?.users ?? 'Users'}
          </Link>
          <Link to="/admin/reports" onClick={onClick} className={getClasses('/admin/reports')}>
            <BarChart3 className="w-4 h-4 me-1.5" /> {t?.nav?.reports ?? 'Reports'}
          </Link>
          <Link to="/admin/activity-log" onClick={onClick} className={getClasses('/admin/activity-log')}>
            <ClipboardList className="w-4 h-4 me-1.5" /> {t?.nav?.activity ?? 'Activity'}
          </Link>
          <Link to="/admin/settings" onClick={onClick} className={getClasses('/admin/settings')}>
            <Settings className="w-4 h-4 me-1.5" /> {t?.nav?.settings ?? 'Settings'}
          </Link>
        </>
      )}
    </>
  );
};
