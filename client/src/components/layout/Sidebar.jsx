import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, PlusCircle, BarChart2,
  BookMarked, Users, UserCheck, Settings,
  ShieldCheck, FileWarning, ScrollText, TrendingUp,
  ChefHat, MessageCircle, X, ArrowLeft
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">{badge}</span>
      )}
    </NavLink>
  );
};

const SectionLabel = ({ children }) => (
  <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-surface-400 uppercase tracking-[0.08em]">{children}</p>
);

const Sidebar = ({ onClose }) => {
  const { isChef, isAdmin } = useRole();
  const { user } = useAuth();
  const userProfileImage = getUserProfileImage(user);

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 h-full flex flex-col border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl lg:shadow-none">
      {/* Mobile close header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800 lg:hidden">
        <span className="font-display font-bold text-lg text-brand-500">Menu</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500 hover:text-surface-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User summary */}
      <div className="p-4 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-3">
          {userProfileImage ? (
            <img src={userProfileImage} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-500/20" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-surface-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                isAdmin ? 'bg-purple-500' : isChef ? 'bg-brand-500' : 'bg-blue-500'
              }`} />
              <p className="text-xs text-surface-500 capitalize font-medium">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Common */}
        <SectionLabel>Account</SectionLabel>
        <NavItem to="/settings/profile" icon={Settings} label="Profile Settings" onClick={handleNavClick} />
        <NavItem to="/saved" icon={BookMarked} label="Saved Recipes" onClick={handleNavClick} />
        <NavItem to="/inbox" icon={MessageCircle} label="Inbox" onClick={handleNavClick} />
        <NavItem to="/followers" icon={Users} label="Followers" onClick={handleNavClick} />
        <NavItem to="/following" icon={UserCheck} label="Following" onClick={handleNavClick} />

        {/* Chef section */}
        {isChef && (
          <>
            <SectionLabel>Chef Studio</SectionLabel>
            <NavItem to="/chef/recipes" icon={UtensilsCrossed} label="My Recipes" onClick={handleNavClick} />
            <NavItem to="/chef/recipes/create" icon={PlusCircle} label="Create Recipe" onClick={handleNavClick} />
            <NavItem to="/chef/analytics" icon={BarChart2} label="Analytics" onClick={handleNavClick} />
          </>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" onClick={handleNavClick} />
            <NavItem to="/admin/users" icon={ShieldCheck} label="Manage Users" onClick={handleNavClick} />
            <NavItem to="/admin/recipes/pending" icon={FileWarning} label="Pending Recipes" onClick={handleNavClick} />
            <NavItem to="/admin/audit-logs" icon={ScrollText} label="Audit Logs" onClick={handleNavClick} />
            <NavItem to="/admin/stats" icon={TrendingUp} label="Platform Stats" onClick={handleNavClick} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-100 dark:border-surface-800">
        <NavLink
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 text-sm text-surface-500 hover:text-brand-500 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to RecipeNest
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
