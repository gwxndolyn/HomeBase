import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown, Search, Plus, Heart, ShoppingBag, Bell, Sun, Moon, MessageCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import shareLahLogo from './sharelah.png';

const LiquidGlassNav: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [currentUser?.photoURL]);

  // Handle scroll to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      setShowMobileMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? ''
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation(currentUser ? '/home' : '/')}>
            <img src={shareLahLogo} alt="HomeBase Logo" className="w-20 h-20" />
          </div>

          {/* Desktop Navigation - only show if user is logged in */}
          {currentUser && (
            <div className={`hidden md:flex items-center space-x-6 transition-all duration-300 ${
              scrolled
                ? `py-3 px-6 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-black/40 backdrop-blur-2xl border-white/10'
                      : 'bg-white/40 backdrop-blur-2xl border-gray-200/30'
                  }`
                : ''
            }`}>
              <button
                onClick={() => handleNavigation('/browse')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Browse</span>
              </button>
              <button
                onClick={() => handleNavigation('/list-item')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">List Item</span>
              </button>
              <button
                onClick={() => handleNavigation('/my-rentals')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-medium">My Rentals</span>
              </button>
              <button
                onClick={() => handleNavigation('/favorites')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Favorites</span>
              </button>
              <button
                onClick={() => handleNavigation('/chat')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>
          )}

          {/* Right Side - Desktop Auth + Mobile Menu Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Button - Only show on mobile when logged in */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`md:hidden p-2 rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
                }`}
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop Only - Theme Toggle and Notifications */}
              <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
                }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notification Bell */}
              <button className={`p-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}>
                <Bell className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-full transition-all duration-300 border shadow-lg hover:shadow-xl backdrop-blur-sm ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-white border-white/10 hover:border-white/20'
                      : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-gray-900 border-gray-300/30 hover:border-gray-400/50'
                  }`}
                >
                {currentUser.photoURL && !imageError ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                    onError={() => setImageError(true)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium">
                  {currentUser.displayName?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Desktop Dropdown Menu */}
              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl backdrop-blur-sm overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-black/80 border-white/10'
                    : 'bg-white/90 border-gray-200/50'
                }`}>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleNavigation('/profile');
                      }}
                      className={`flex items-center space-x-3 w-full px-4 py-3 transition-colors ${
                        theme === 'dark'
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleNavigation('/settings');
                      }}
                      className={`flex items-center space-x-3 w-full px-4 py-3 transition-colors ${
                        theme === 'dark'
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center space-x-3 w-full px-4 py-3 transition-colors ${
                        theme === 'dark'
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 border shadow-lg hover:shadow-xl backdrop-blur-sm ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-white border-white/10 hover:border-white/20'
                  : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-gray-900 border-gray-300/30 hover:border-gray-400/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Sign In</span>
            </button>
          )}
        </div>
      </div>

              {/* Mobile Menu Dropdown */}
              {currentUser && showMobileMenu && (
                <div className={`md:hidden absolute top-full left-0 right-0 mt-2 mx-4 rounded-2xl border shadow-xl backdrop-blur-sm overflow-y-auto max-h-[calc(100vh-120px)] z-40 ${
                  theme === 'dark'
                    ? 'bg-black/90 border-white/10'
                    : 'bg-white/95 border-gray-200/50'
                }`}>
                  <div className="py-2">
            {/* Navigation Links */}
            <button
              onClick={() => handleNavigation('/browse')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Browse</span>
            </button>
            <button
              onClick={() => handleNavigation('/list-item')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">List Item</span>
            </button>
            <button
              onClick={() => handleNavigation('/my-rentals')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">My Rentals</span>
            </button>
            <button
              onClick={() => handleNavigation('/favorites')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Favorites</span>
            </button>
            <button
              onClick={() => handleNavigation('/chat')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat</span>
            </button>

            {/* Divider */}
            <div className={`my-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`} />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* User Profile Section */}
            <div className={`my-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`} />
            
            <button
              onClick={() => handleNavigation('/profile')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={() => handleNavigation('/settings')}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center space-x-3 w-full px-6 py-4 transition-colors ${
                theme === 'dark'
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LiquidGlassNav; 