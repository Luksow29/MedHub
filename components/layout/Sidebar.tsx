import React from 'react';
import { User } from '@supabase/supabase-js';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  user: User;
  collapsed: boolean;
  isOpen: boolean;
  isMobile: boolean;
  currentPage: string;
  onToggle: () => void;
  onClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  tamilLabel: string;
  icon: React.ReactNode;
  href: string;
  children?: NavigationItem[];
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  isOpen,
  isMobile,
  currentPage,
  onClose
}) => {
  const location = useLocation();

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      tamilLabel: 'டாஷ்போர்டு',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
      href: '/dashboard'
    },
    {
      id: 'appointments',
      label: 'Appointment Management',
      tamilLabel: 'சந்திப்பு நிர்வாகம்',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/appointments',
      children: [
        {
          id: 'calendar',
          label: 'Calendar View',
          tamilLabel: 'நாட்காட்டி காட்சி',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          href: '/appointments/calendar'
        },
        {
          id: 'scheduler',
          label: 'Scheduler',
          tamilLabel: 'அட்டவணையாளர்',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          href: '/appointments/scheduler'
        },
        {
          id: 'waitlist',
          label: 'Waitlist',
          tamilLabel: 'காத்திருப்பு பட்டியல்',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          href: '/appointments/waitlist'
        }
      ]
    },
    {
      id: 'patients',
      label: 'Patient Management',
      tamilLabel: 'நோயாளர் நிர்வாகம்',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/patients',
      children: [
        {
          id: 'patient-directory',
          label: 'Patient Directory',
          tamilLabel: 'நோயாளர் அடைவு',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          href: '/patients/directory'
        },
        {
          id: 'patient-search',
          label: 'Search Patients',
          tamilLabel: 'நோயாளிகளைத் தேடு',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
          href: '/patients/search'
        },
        {
          id: 'medical-records',
          label: 'Medical Records',
          tamilLabel: 'மருத்துவ பதிவுகள்',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          href: '/patients/records'
        }
      ]
    }
  ];

  const isActiveItem = (item: NavigationItem): boolean => {
    if (item.href === location.pathname) return true;
    if (item.children) {
      return item.children.some(child => child.href === location.pathname);
    }
    return false;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isActiveItem(item);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        <Link
          to={item.href}
          onClick={isMobile ? onClose : undefined}
          className={`
            flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${level > 0 ? 'ml-6' : ''}
            ${isActive 
              ? 'bg-sky-100 text-sky-700 border-r-2 border-sky-500' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }
            ${collapsed && level === 0 ? 'justify-center' : ''}
          `}
          title={collapsed ? getBilingualLabel(item.label, item.tamilLabel) : undefined}
        >
          <span className={`flex-shrink-0 ${collapsed && level === 0 ? '' : 'mr-3'}`}>
            {item.icon}
          </span>
          {(!collapsed || level > 0) && (
            <span className="truncate">
              {getBilingualLabel(item.label, item.tamilLabel)}
            </span>
          )}
          {item.badge && (!collapsed || level > 0) && (
            <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
          {hasChildren && (!collapsed || level > 0) && (
            <svg className="ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </Link>
        
        {hasChildren && (!collapsed || level > 0) && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 shadow-lg z-50 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-slate-200 bg-sky-50">
          {collapsed ? (
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MH</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-sky-700">MedRemind Hub</h1>
                <p className="text-xs text-slate-500">Healthcare Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-200 p-4">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-slate-600 text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-slate-600 text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500">Healthcare Provider</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;