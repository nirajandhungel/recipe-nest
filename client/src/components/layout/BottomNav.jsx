import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageCircle, BookMarked, ChefHat, User, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';

const BottomNav = () => {
  const { user } = useAuth();
  const { isChef } = useRole();
  const location = useLocation();
  const userProfileImage = getUserProfileImage(user);
  const path = location.pathname;

  // Don't show on auth pages or inbox conversation (full screen chat)
  if (path.startsWith('/auth')) return null;

  const isActive = (href, exact = false) => {
    if (exact) return path === href;
    return path.startsWith(href);
  };

  const isLoggedIn = !!user;

  /* ── Not logged in: 5 icons ── */
  if (!isLoggedIn) {
    const items = [
      { to: '/', icon: Home, label: 'Home', exact: true },
      { to: '/recipes', icon: Compass, label: 'Explore' },
      { to: '/chefs', icon: ChefHat, label: 'Chefs' },
      { to: '/search', icon: Search, label: 'Search' },
      { to: '/auth/login', icon: User, label: 'Log in' },
    ];

    return (
      <nav className="btm-nav">
        <div className="btm-nav-inner">
          {items.map(({ to, icon: Icon, label, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link key={to} to={to} className={`btm-nav-item ${active ? 'btm-active' : ''}`}>
                <Icon
                  className="btm-nav-icon"
                  strokeWidth={active ? 2.5 : 2}
                  // fill={active ? 'currentColor' : 'none'}
                />
                <span className="btm-nav-label">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ── Logged in: 6 icons ── */
  const items = [
    { to: '/', icon: Home, label: 'Home', exact: true },
    { to: '/recipes', icon: Search, label: 'Explore', matchAlso: ['/chefs', '/search'] },
    { to: isChef ? '/chef/recipes/create' : '/chefs', icon: isChef ? PlusSquare : ChefHat, label: isChef ? 'Create' : 'Chefs' },
    { to: '/saved', icon: BookMarked, label: 'Saved' },
    { to: '/inbox', icon: MessageCircle, label: 'Inbox' },
    { to: '/settings/profile', icon: null, label: 'Profile', isProfile: true },
  ];

  return (
    <nav className="btm-nav">
      <div className="btm-nav-inner btm-nav-6">
        {items.map(({ to, icon: Icon, label, exact, matchAlso, isProfile }) => {
          let active = isActive(to, exact);
          if (matchAlso) active = active || matchAlso.some((m) => path.startsWith(m));
          if (isProfile) active = active || isActive('/settings') || isActive('/followers') || isActive('/following') || isActive('/chef');

          if (isProfile) {
            return (
              <Link key="profile" to={to} className={`btm-nav-item ${active ? 'btm-active' : ''}`}>
                <div className={`btm-nav-avatar ${active ? 'btm-avatar-active' : ''}`}>
                  {userProfileImage ? (
                    <img src={userProfileImage} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-[9px] font-bold leading-none">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                </div>
                <span className="btm-nav-label">{label}</span>
              </Link>
            );
          }

          return (
            <Link key={to} to={to} className={`btm-nav-item ${active ? 'btm-active' : ''}`}>
              <Icon
                className="btm-nav-icon"
                strokeWidth={active ? 2.5 : 2}
                // fill={active ? 'currentColor' : 'none'}
              />
              <span className="btm-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
