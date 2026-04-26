import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isDashboard />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — fixed on mobile, static on desktop */}
        <div
          className={`
            fixed top-0 left-0 h-full z-50 lg:static lg:z-auto
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
