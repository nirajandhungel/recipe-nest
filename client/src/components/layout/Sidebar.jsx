import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, PlusCircle, BarChart2,
  BookMarked, Users, UserCheck, Settings,
  ShieldCheck, FileWarning, ScrollText, TrendingUp,
  ChefHat, MessageCircle
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800'
      }`
    }
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    {label}
  </NavLink>
);

const Sidebar = () => {
  const { isChef, isAdmin } = useRole();
  const { user } = useAuth();
  const userProfileImage = getUserProfileImage(user);

  return (
    <aside className="w-60 flex-shrink-0 h-full flex flex-col border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* User summary */}
      <div className="p-4 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-3">
          {userProfileImage ? (
            <img src={userProfileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Common */}
        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-surface-400 uppercase tracking-wider">Account</p>
        <NavItem to="/settings/profile" icon={Settings} label="Profile Settings" />
        <NavItem to="/saved" icon={BookMarked} label="Saved Recipes" />
        <NavItem to="/inbox" icon={MessageCircle} label="Inbox" />
        <NavItem to="/followers" icon={Users} label="Followers" />
        <NavItem to="/following" icon={UserCheck} label="Following" />

        {/* Chef section */}
        {isChef && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold text-surface-400 uppercase tracking-wider">Chef</p>
            <NavItem to="/chef/recipes" icon={UtensilsCrossed} label="My Recipes" />
            <NavItem to="/chef/recipes/create" icon={PlusCircle} label="Create Recipe" />
            <NavItem to="/chef/analytics" icon={BarChart2} label="Analytics" />
          </>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold text-surface-400 uppercase tracking-wider">Admin</p>
            <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/admin/users" icon={ShieldCheck} label="Users" />
            <NavItem to="/admin/recipes/pending" icon={FileWarning} label="Pending Recipes" />
            <NavItem to="/admin/audit-logs" icon={ScrollText} label="Audit Logs" />
            <NavItem to="/admin/stats" icon={TrendingUp} label="Platform Stats" />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-100 dark:border-surface-800">
        <NavLink to="/" className="flex items-center gap-2 text-sm text-surface-500 hover:text-brand-500 transition-colors">
          <ChefHat className="w-4 h-4" />
          Back to RecipeNest
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
