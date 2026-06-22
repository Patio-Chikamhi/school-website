// src/components/dashboard/TopHeader.jsx - Updated
import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, X } from 'lucide-react';

export const TopHeader = ({ 
  title = 'Dashboard',
  subtitle = 'Welcome back',
  userName = 'User',
  userAvatar,
  notificationCount = 0,
  onSearch,
  onNotificationsClick,
  onSettingsClick,
  onMenuClick,
  onMobileMenuToggle,
  isMobileMenuOpen = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New assignment posted', time: '2 hours ago', read: false },
    { id: 2, title: 'Grade updated', time: '5 hours ago', read: false },
    { id: 3, title: 'System maintenance', time: '1 day ago', read: true },
  ];

  const unreadCount = notificationCount || notifications.filter(n => !n.read).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (onNotificationsClick) onNotificationsClick();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Mobile Menu Button & Title */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button - visible only on mobile */}
            <button
              onClick={onMobileMenuToggle || onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                {subtitle}, <span className="font-semibold text-emerald-600">{userName}</span>
              </p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - hide on very small screens */}
            <form onSubmit={handleSearch} className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-48 lg:w-64 transition-colors text-sm"
              />
            </form>
            
            {/* Search button for mobile */}
            <button className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotifications}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-200">
                    <button className="text-sm text-emerald-600 hover:text-emerald-800">View all</button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity text-sm sm:text-base">
                {userAvatar || userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Logged in</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};