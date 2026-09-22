// src/components/dashboard/Sidebar.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';       // ← Add at top
import { signOut } from 'firebase/auth';            // ← Add at top

import {
  Home, Users, Award, UsersIcon, BookOpen, FileText,
  MessageSquare, Upload, BarChart3, Settings, GraduationCap,
  LogOut, Bell, ChevronLeft, ChevronRight, Menu, X,
  Calendar, FileSpreadsheet, Clock, UserCheck, User,
  File, ClipboardList, FolderOpen, ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Sidebar = ({
  activeSection = 'dashboard',
  onSectionChange,
  userType = 'admin',
  userName = 'User',
  userRole = 'Administrator',
  collapsed = false,
  onToggleCollapse,
  isMobileOpen: externalMobileOpen,
  onMobileClose
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const mobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setMobileOpen = (value) => {
    if (onMobileClose && value === false) {
      onMobileClose();
    } else {
      setInternalMobileOpen(value);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && mobileOpen) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileOpen]);

  const handleNavClick = (sectionId) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  // ============================================
  // NAVIGATION ITEMS
  // ============================================

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'enrollment', label: 'Enrollment', icon: Users },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'leaders', label: 'Leaders', icon: Award },
    { id: 'teacherApprovals', label: 'Teacher Approvals', icon: UsersIcon },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'schoolReports', label: 'Class Reports', icon: FileSpreadsheet },
    { id: 'studentReports', label: 'Student Reports', icon: FileText },
    { id: 'allPublishedReports', label: 'All Published', icon: ClipboardCheck },
    { id: 'upload', label: 'Upload Media', icon: Upload },
    { id: 'contactMessages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'reports', label: 'My Reports', icon: FileSpreadsheet },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const parentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'children', label: 'My Children', icon: Users },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'reports', label: 'Term Reports', icon: FileSpreadsheet },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'payments', label: 'Payments', icon: BarChart3 },
  ];

  // ✅ FIXED: Clear differentiation between the two report features
  const teacherNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'students', label: 'My Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'grades', label: 'Gradebook', icon: Award },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'materials', label: 'Course Materials', icon: Upload },
    // ✅ RENAMED for clarity:
    { id: 'studentReports', label: 'Single Subject Report', icon: FileText },
    { id: 'termReports', label: 'Term Reports', icon: FileSpreadsheet },
    { id: 'publishedReports', label: 'All Published', icon: ClipboardCheck },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const financeNavItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'students', label: 'Student Fees', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: FileText },
  ];

  const navItems = userType === 'admin' ? adminNavItems :
                   userType === 'student' ? studentNavItems :
                   userType === 'teacher' ? teacherNavItems :
                   userType === 'finance' ? financeNavItems :
                   parentNavItems;

  const handleLogout = async () => {
  try {
    await signOut(auth);
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
    navigate('/login');
  }
};

  if (isMobile && !mobileOpen) {
    return null;
  }

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`
        bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 transition-all duration-300 flex flex-col
        ${isMobile ? 'w-72 shadow-xl' : (collapsed ? 'w-20' : 'w-64')}
        ${isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className={`flex items-center ${(!isMobile && collapsed) ? 'justify-center' : 'justify-between'} gap-3`}>
            {(!isMobile && collapsed) ? (
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Evergreen Academy</h2>
                  <p className="text-xs text-gray-500 capitalize">{userType} Portal</p>
                </div>
              </div>
            )}

            {isMobile && (
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {!isMobile && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-gray-200 flex-shrink-0 ${(!isMobile && collapsed) ? 'text-center' : ''}`}>
          <div className={`flex ${(!isMobile && collapsed) ? 'flex-col' : 'items-center gap-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {(!isMobile && collapsed) ? null : (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-sm text-gray-500 truncate">{userRole}</p>
              </div>
            )}
          </div>

          {(!isMobile && collapsed) ? null : (
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center ${(!isMobile && collapsed) ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                title={(!isMobile && collapsed) ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!isMobile && collapsed) ? null : <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;