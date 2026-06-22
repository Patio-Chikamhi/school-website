// src/components/Header.jsx - UPDATED with white/emerald theme
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Menu, X, Bell, ChevronDown, 
  User, LogOut, Settings, Home, Info, BookOpen, 
  Camera, Mail, Newspaper, Sparkles, Shield, Book,
  Calendar, Image, Users, Globe, TrendingUp,
  ChevronRight, ShieldCheck, UserCircle
} from 'lucide-react';
import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const Header = ({ currentUser, auth, SCHOOL_NAME = "Evergreen Academy", NAVIGATION_LINKS = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const loginDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Scroll effect for dynamic header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setShowLoginDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!db || !currentUser?.uid) return;

    const fetchNotifications = () => {
      try {
        let notificationsQuery;
        
        if (currentUser.role === 'student') {
          notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
        } else if (currentUser.role === 'teacher') {
          notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipientRole', 'in', ['teacher', 'all']),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
        } else if (currentUser.role === 'admin') {
          notificationsQuery = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(15)
          );
        } else {
          return;
        }

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          
          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        });

        return () => unsubscribe();
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [db, currentUser]);

  const getHeaderClasses = () => {
    const baseClasses = "sticky top-0 z-50 transition-all duration-300";
    
    if (scrolled) {
      return `${baseClasses} shadow-xl bg-white/95 backdrop-blur-lg border-b border-gray-200`;
    } else {
      // Clean white with emerald accent
      return `${baseClasses} bg-white border-b border-emerald-100 text-gray-800`;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      setShowUserDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleLoginDropdown = () => {
    setShowLoginDropdown(!showLoginDropdown);
    setShowUserDropdown(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
    setShowLoginDropdown(false);
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/admin/login';
    
    switch(currentUser.role) {
      case 'student':
        return '/dashboard';
      case 'teacher':
        return '/dashboard';
      case 'admin':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getDashboardText = () => {
    if (!currentUser) return 'Dashboard';
    
    switch(currentUser.role) {
      case 'student':
        return 'Student Portal';
      case 'teacher':
        return 'Teacher Portal';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const formatNotificationTime = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'assignment': return '📝';
      case 'grade': return '📊';
      case 'attendance': return '✅';
      case 'approval': return '🎉';
      case 'enrollment': return '👤';
      case 'announcement': return '📢';
      case 'newsletter': return '📰';
      case 'event': return '🎪';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'assignment': return 'text-blue-600 bg-blue-50';
      case 'grade': return 'text-purple-600 bg-purple-50';
      case 'announcement': return 'text-emerald-600 bg-emerald-50';
      case 'newsletter': return 'text-yellow-600 bg-yellow-50';
      case 'event': return 'text-pink-600 bg-pink-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      if (!notification.read) {
        console.log('Marking notification as read:', notification.id);
      }
      
      // Handle navigation based on notification type
      switch(notification.type) {
        case 'announcement':
        case 'newsletter':
        case 'event':
        case 'achievement':
          if (notification.postId) {
            navigate(`/posts/${notification.postId}`);
          }
          break;
        default:
          break;
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      // Implement your logic here
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Get icon for navigation items
  const getNavIcon = (name) => {
    switch(name) {
      case 'Home': return <Home className="w-4 h-4" />;
      case 'About Us': return <Info className="w-4 h-4" />;
      case 'Admissions': return <BookOpen className="w-4 h-4" />;
      case 'Academics': return <GraduationCap className="w-4 h-4" />;
      case 'Media & Gallery': return <Camera className="w-4 h-4" />;
      case 'Contact Us': return <Mail className="w-4 h-4" />;
      case 'Photo Gallery': return <Image className="w-4 h-4" />;
      case 'News & Updates': return <Newspaper className="w-4 h-4" />;
      default: return null;
    }
  };

  // Mobile text color helper
  const getMobileTextColor = () => {
    if (isMobile && !scrolled) {
      return 'text-gray-800';
    }
    return '';
  };

  return (
    <header className={getHeaderClasses()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Container */}
        <div className="flex items-center justify-between py-3">
          
          {/* Logo Section - Left */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
                scrolled || isMobile
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md' 
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
              }`}>
                <GraduationCap className={`w-6 h-6 text-white`} />
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${getMobileTextColor()} ${
                  scrolled ? 'text-gray-900' : isMobile ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {SCHOOL_NAME}
                </h1>
                <p className={`text-xs ${getMobileTextColor()} ${
                  scrolled ? 'text-gray-600' : isMobile ? 'text-emerald-600' : 'text-emerald-600'
                }`}>
                  Excellence in Education
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAVIGATION_LINKS.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div 
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <button
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        scrolled 
                          ? location.pathname.startsWith('/gallery') || location.pathname.startsWith('/posts')
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                          : location.pathname.startsWith('/gallery') || location.pathname.startsWith('/posts')
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {getNavIcon(link.name)}
                      <span>{link.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 py-2 animate-fadeIn z-50">
                        {link.dropdownItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-150 ${
                              location.pathname === item.path
                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-700 font-medium border-r-4 border-emerald-500'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600 hover:pl-5'
                            }`}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            {getNavIcon(item.name)}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) => `
                    flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${scrolled 
                      ? isActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                      : isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }
                  `}
                >
                  {getNavIcon(link.name)}
                  <span>{link.name}</span>
                </NavLink>
              );
            })}

            {/* Dashboard Link for logged-in users */}
            {currentUser && (
              <NavLink
                to={getDashboardLink()}
                className={({ isActive }) => `
                  flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${scrolled 
                    ? isActive 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                    : isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                  }
                `}
              >
                <Sparkles className="w-4 h-4" />
                <span>{getDashboardText()}</span>
              </NavLink>
            )}
          </nav>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Notifications - Mobile optimized */}
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-full transition-all duration-200 relative ${
                      scrolled 
                        ? 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50' 
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      />
                      
                      <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fadeIn">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-500">
                                {unreadCount} unread
                              </span>
                              {unreadCount > 0 && (
                                <button 
                                  onClick={markAllAsRead}
                                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {notifications.map(notification => (
                                <div 
                                  key={notification.id} 
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                                    !notification.read ? 'bg-blue-50/50' : ''
                                  }`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                      getNotificationColor(notification.type)
                                    }`}>
                                      {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-medium text-gray-900 leading-tight">
                                          {notification.title || notification.message}
                                        </p>
                                        {!notification.read && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse"></div>
                                        )}
                                      </div>
                                      {notification.message && (
                                        <p className="text-sm text-gray-600 mb-2">
                                          {notification.message}
                                        </p>
                                      )}
                                      <div className="flex justify-between items-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          getNotificationColor(notification.type)
                                        }`}>
                                          {notification.type?.charAt(0).toUpperCase() + notification.type?.slice(1) || 'Notification'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {formatNotificationTime(notification.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-emerald-600" />
                              </div>
                              <p className="text-gray-600 font-medium">No notifications</p>
                              <p className="text-sm text-gray-400 mt-1">
                                You're all caught up!
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 border-t border-gray-100">
                          <Link 
                            to="/notifications" 
                            className="block text-center text-sm text-emerald-600 hover:text-emerald-800 font-medium py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                            onClick={() => setShowNotifications(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* User Profile - CLICKABLE with dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button 
                    onClick={toggleUserDropdown}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    <div className="text-right hidden md:block">
                      <p className={`text-sm font-medium truncate max-w-[160px] ${
                        scrolled || isMobile ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {currentUser.name || currentUser.email?.split('@')[0]}
                      </p>
                      <p className={`text-xs truncate max-w-[160px] ${
                        scrolled || isMobile ? 'text-gray-500' : 'text-emerald-600'
                      }`}>
                        {currentUser.role === 'admin' ? 'Administrator' : 
                         currentUser.role === 'teacher' ? 'Faculty' : 
                         currentUser.role === 'student' ? 'Student' : 'Guest'}
                        {currentUser.studentId && ` • ${currentUser.studentId}`}
                        {currentUser.teacherId && ` • ${currentUser.teacherId}`}
                      </p>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
                      scrolled || isMobile
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-300'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-200'
                    }`}>
                      {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                      {currentUser.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      showUserDropdown ? 'rotate-180' : ''
                    } ${scrolled || isMobile ? 'text-gray-600' : 'text-gray-600'}`} />
                  </button>
                  
                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 py-2 animate-fadeIn z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600`}>
                            {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {currentUser.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {currentUser.email}
                            </p>
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-800">
                                {currentUser.role === 'admin' ? 'Administrator' : 
                                 currentUser.role === 'teacher' ? 'Faculty Member' : 
                                 currentUser.role === 'student' ? 'Student' : 'User'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors rounded-lg mx-2"
                        >
                          <UserCircle className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors rounded-lg mx-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </Link>
                        {currentUser.role === 'admin' && (
                          <Link
                            to="/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors rounded-lg mx-2"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100 mx-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Guest View - Collapsible Login Dropdown
              <div className="relative" ref={loginDropdownRef}>
                <button 
                  onClick={toggleLoginDropdown}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${scrolled || isMobile
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700'
                    }
                  `}
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${
                    showLoginDropdown ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {/* Login Dropdown */}
                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 py-2 animate-fadeIn z-50">
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-500 font-medium mb-2">Access your account</p>
                    </div>
                    <Link
                      to="/student/login"
                      onClick={() => setShowLoginDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors rounded-lg mx-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <div>
                        <p className="font-medium">Student Login</p>
                        <p className="text-xs text-gray-500">Access assignments & grades</p>
                      </div>
                    </Link>
                    <div className="h-px bg-gray-100 mx-4 my-1"></div>
                    <Link
                      to="/admin/login"
                      onClick={() => setShowLoginDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors rounded-lg mx-2"
                    >
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="font-medium">Staff Login</p>
                        <p className="text-xs text-gray-500">Faculty & Administration</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${
                scrolled || isMobile
                  ? 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200/30 pt-4 pb-4 animate-slideDown">
            <div className="space-y-1 mb-4">
              {NAVIGATION_LINKS.map((link) => (
                <div key={link.name}>
                  {link.hasDropdown ? (
                    <div className="mb-3">
                      <div className="px-3 py-2.5 text-gray-700 font-medium flex items-center space-x-2">
                        {getNavIcon(link.name)}
                        <span>{link.name}</span>
                      </div>
                      <div className="ml-8 space-y-1 border-l-2 border-emerald-100 pl-4">
                        {link.dropdownItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            {getNavIcon(item.name)}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      {getNavIcon(link.name)}
                      <span>{link.name}</span>
                    </Link>
                  )}
                </div>
              ))}

              {/* Dashboard in mobile */}
              {currentUser && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{getDashboardText()}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 border-t border-gray-200/30">
              {currentUser ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center font-semibold text-white">
                      {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {currentUser.name || currentUser.email?.split('@')[0]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentUser.role === 'admin' ? 'Administrator' : 
                         currentUser.role === 'teacher' ? 'Faculty' : 
                         currentUser.role === 'student' ? 'Student' : 'Guest'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Links - RESPONSIVE */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/profile"
                      onClick={() => {
                        setIsOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <UserCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => {
                        setIsOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Settings className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Settings</span>
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <ShieldCheck className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                      }}
                      className="flex flex-col items-center justify-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors relative"
                    >
                      <Bell className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Notifications in mobile */}
                  {showNotifications && (
                    <div className="px-3 pt-2">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                        <span>Notifications ({unreadCount})</span>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-600 hover:text-emerald-800"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.slice(0, 3).map(notification => (
                          <div 
                            key={notification.id}
                            className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                            }`}
                            onClick={() => {
                              handleNotificationClick(notification);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <span className="text-lg mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div>
                                <p className="text-gray-800 font-medium">
                                  {notification.title || 'New Notification'}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                  {notification.message}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    getNotificationColor(notification.type)
                                  }`}>
                                    {notification.type}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatNotificationTime(notification.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                // Mobile Login Options
                <div className="space-y-3">
                  <div className="px-3">
                    <p className="text-sm text-gray-600 mb-2">Login as:</p>
                  </div>
                  <Link
                    to="/student/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Student</p>
                      <p className="text-xs text-gray-500">Access assignments & grades</p>
                    </div>
                  </Link>
                  <Link
                    to="/admin/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Staff</p>
                      <p className="text-xs text-white/80">Faculty & Administration</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;