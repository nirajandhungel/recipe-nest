import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-950">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
