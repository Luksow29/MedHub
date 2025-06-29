import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import LoadingSpinner from '../shared/LoadingSpinner';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  currentPage: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  isLoading?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  user,
  onLogout,
  children,
  currentPage,
  breadcrumbs = [],
  isLoading = false
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        currentPage={currentPage}
        onToggle={toggleSidebar}
        onClose={closeMobileSidebar}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Header */}
        <Header
          user={user}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} />
        )}

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;