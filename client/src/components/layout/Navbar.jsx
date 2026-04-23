import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Search, Menu, X, BookMarked, LogOut, Settings, LayoutDashboard, PlusCircle } from 'lucide-react';
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

const Navbar = () => {
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
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-surface-600 hover:text-surface-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            <span className="font-display font-bold text-2xl text-brand-500">
              recipe<span className="text-surface-900 dark:text-white">nest</span>
            </span>
          </Link>

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
          <div className="flex items-center gap-3">
            {/* Mobile search toggle */}
            <button className="md:hidden p-2 text-surface-600" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isChef && (
                  <Link 
                    to="/chef/recipes/create" 
                    className="hidden md:flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm font-semibold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Recipe</span>
                  </Link>
                )}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2"
                  >
                    {userProfileImage ? (
                      <img src={userProfileImage} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg py-2 shadow-xl animate-fade-in z-50">
                      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-surface-500">@{user.username}</p>
                      </div>

                      {isChef && (
                        <Link to="/chef/recipes" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-surface-500" />
                          Chef Dashboard
                        </Link>
                      )}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-surface-500" />
                          Admin Panel
                        </Link>
                      )}
                      <Link to="/saved" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <BookMarked className="w-4 h-4 text-surface-500" />
                        My Saves
                      </Link>
                      <Link to="/settings/profile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <Settings className="w-4 h-4 text-surface-500" />
                        Settings
                      </Link>
                      <div className="border-t border-surface-100 dark:border-surface-800 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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

      {/* Stats Banner — green */}
      <div className="bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-xs sm:text-sm">
          <span className="font-semibold">Nepal's <span className="underline underline-offset-2">#1 Recipe Community</span></span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-200"></span><b>1K+</b> Original Recipes</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-200"></span><b>5K+</b> Ratings & Reviews</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-200"></span><b>2K+</b> Home Cooks</span>
        </div>
      </div>

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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white dark:bg-surface-900 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-bold text-surface-700 uppercase tracking-wider hover:text-brand-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
