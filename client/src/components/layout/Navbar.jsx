import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChefHat, Search, Menu, X, BookMarked, LogOut, Settings, LayoutDashboard,
  PlusCircle, MessageCircle, Users, BarChart2, Bell, UserCheck, ShieldCheck
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';

const NAV_LINKS = [
  { to: '/recipes?mealType=Dinner', label: 'DINNERS' },
  { to: '/recipes?mealType=Lunch', label: 'MEALS' },
  { to: '/recipes?mealType=Breakfast', label: 'BREAKFAST' },
  { to: '/recipes?cuisine=Italian', label: 'CUISINES' },
  { to: '/chefs', label: 'CHEFS' },
  { to: '/recipes?mealType=Dessert', label: 'DESSERTS' },
];

const Navbar = ({ onToggleSidebar, isDashboard = false }) => {
  const { user, logout } = useAuth();
  const { isChef, isAdmin } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);
  const userProfileImage = getUserProfileImage(user);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-surface-900 shadow-sm">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side: menu + logo */}
          <div className="flex items-center gap-2">
            {/* Sidebar toggle — only on dashboard, hidden on mobile (bottom nav) shown on md-lg */}
            {isDashboard && (
              <button
                className="hidden md:flex lg:hidden p-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl text-brand-500">
                recipe<span className="text-surface-900 dark:text-white">nest</span>
              </span>
            </Link>
          </div>

          {/* Center search bar — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Find a recipe or ingredient"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-surface-300 rounded-l-md px-4 py-2 text-sm focus:outline-none focus:border-brand-500 placeholder-surface-400"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-r-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Quick action: Create Recipe (Chef only, desktop) */}
                {isChef && (
                  <Link
                    to="/chef/recipes/create"
                    className="hidden md:flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm font-semibold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Recipe</span>
                  </Link>
                )}

                {/* Quick nav icons */}
                <Link
                  to="/inbox"
                  className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                    location.pathname.startsWith('/inbox')
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                  }`}
                  title="Inbox"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>

                <Link
                  to="/saved"
                  className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                    location.pathname === '/saved'
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                  }`}
                  title="Saved Recipes"
                >
                  <BookMarked className="w-5 h-5" />
                </Link>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center gap-2 p-1 rounded-full transition-all ${
                      profileOpen ? 'ring-2 ring-brand-500/40' : 'hover:ring-2 hover:ring-surface-200'
                    }`}
                  >
                    {userProfileImage ? (
                      <img src={userProfileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-bold">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl py-1.5 shadow-2xl animate-fade-in z-50"
                      style={{ boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)' }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-3">
                          {userProfileImage ? (
                            <img src={userProfileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-bold">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</p>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isAdmin ? 'bg-purple-500' : isChef ? 'bg-brand-500' : 'bg-blue-500'
                              }`} />
                              <p className="text-xs text-surface-500 capitalize">{user.role}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick links */}
                      <div className="py-1.5">
                        <Link to="/settings/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                          <Settings className="w-4 h-4 text-surface-400" />
                          Profile Settings
                        </Link>
                        <Link to="/inbox" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                          <MessageCircle className="w-4 h-4 text-surface-400" />
                          Messages
                        </Link>
                        <Link to="/followers" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                          <Users className="w-4 h-4 text-surface-400" />
                          Followers
                        </Link>
                        <Link to="/following" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                          <UserCheck className="w-4 h-4 text-surface-400" />
                          Following
                        </Link>
                        <Link to="/saved" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                          <BookMarked className="w-4 h-4 text-surface-400" />
                          Saved Recipes
                        </Link>
                      </div>

                      {/* Role-specific sections */}
                      {(isChef || isAdmin) && (
                        <div className="border-t border-surface-100 dark:border-surface-800 py-1.5">
                          {isChef && (
                            <>
                              <div className="px-4 py-1.5">
                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Chef Studio</p>
                              </div>
                              <Link to="/chef/recipes" onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                                <LayoutDashboard className="w-4 h-4 text-brand-500" />
                                Chef Dashboard
                              </Link>
                              <Link to="/chef/analytics" onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                                <BarChart2 className="w-4 h-4 text-brand-500" />
                                Analytics
                              </Link>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <div className="px-4 py-1.5">
                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Administration</p>
                              </div>
                              <Link to="/admin" onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300">
                                <ShieldCheck className="w-4 h-4 text-purple-500" />
                                Admin Panel
                              </Link>
                            </>
                          )}
                        </div>
                      )}

                      {/* Logout */}
                      <div className="border-t border-surface-100 dark:border-surface-800 pt-1.5 pb-0.5">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-xl">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors px-3 py-2">Log in</Link>
                <Link to="/auth/register" className="text-sm font-medium bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600 transition-colors">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category navigation bar — desktop */}
      {!isDashboard && (
        <div className="hidden md:block border-t border-surface-200 dark:border-surface-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-8 h-11 text-xs font-bold tracking-wider text-surface-700 dark:text-surface-300 uppercase">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="hover:text-brand-500 transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-brand-500 h-full flex items-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Banner — green */}
      {!isDashboard && (
        <div className="bg-brand-500 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
            <span>Please <b>refresh 2-3 times</b> if data doesn't load immediately.</span>
          </div>
        </div>
      )}

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white dark:bg-surface-900 px-4 py-3 animate-fade-in">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Find a recipe or ingredient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-surface-300 rounded-l-md px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <button type="submit" className="bg-brand-500 text-white px-3 py-2 rounded-r-md">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
