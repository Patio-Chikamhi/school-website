// ✅ CORRECT - Import React and hooks from 'react'
import React, { useState, useEffect } from 'react';

// ✅ CORRECT - Import icons from 'lucide-react'
import { 
  Home, BookOpen, FileText, Award, Users, Upload, User, Calendar,
  Clock, CheckCircle, AlertCircle, Filter, Search, Eye, Download, 
  XCircle, Paperclip, Loader
} from 'lucide-react';

// ✅ CORRECT - Import other dependencies
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, where, getDocs, doc, getDoc, onSnapshot,
  orderBy, limit 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { realTimeService } from '../../utils/realTimeService';

// Import student-specific components
import { Sidebar } from '../dashboard/Sidebar';
import StudentHeader from './StudentHeader';
import StudentOverview from './StudentOverview';
import StudentCourses from './StudentCourses';
import StudentGrades from './StudentGrades';
import StudentAttendance from './StudentAttendance';
import StudentAssignments from './StudentAssignments';
import StudentResources from './StudentResources';
import StudentProfile from './StudentProfile';
import StudentAnalytics from './StudentAnalytics';
import StudentNotifications from './StudentNotifications';
import CalendarView from '../shared/CalendarView';
import StudentTermReports from './StudentTermReports';

// Import shared components
import { LoadingState } from '../dashboard/LoadingState';
import { EmptyState } from '../dashboard/EmptyState';

const StudentDashboard = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [studentData, setStudentData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [realTimeData, setRealTimeData] = useState({
    assignments: [],
    grades: [],
    materials: [],
    attendance: []
  });
  
  const navigate = useNavigate();
  const studentId = currentUser?.uid;

  useEffect(() => {
    if (!studentId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch student profile
        const userDocRef = doc(db, 'users', studentId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('Student profile not found');
        }
        
        const userData = userDoc.data();
        if (userData.role !== 'student') {
          throw new Error('Access denied: Students only');
        }
        
        // Set student data
        const studentProfile = {
          id: studentId,
          uid: studentId,
          fullName: userData.fullName || userData.name || 'Student',
          studentId: userData.studentId || userData.studentDocumentId || studentId,
          email: userData.email,
          grade: userData.grade || 'Not assigned',
          section: userData.section || 'Not assigned',
          parentEmail: userData.parentEmail,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'Student')}&background=10b981&color=fff`,
          status: userData.status || 'active',
          lastLogin: new Date().toLocaleDateString()
        };
        
        setStudentData(studentProfile);
        
        // 2. Initialize realTimeService if it exists
        if (realTimeService && typeof realTimeService.initialize === 'function') {
          realTimeService.initialize(studentProfile);
        }
        
        // 3. Fetch enrolled courses in real-time
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', studentProfile.studentId)
        );
        
        const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, (snapshot) => {
          const courses = [];
          snapshot.forEach((doc) => {
            const enrollment = doc.data();
            courses.push({
              id: doc.id,
              ...enrollment,
              enrolledAt: enrollment.enrolledAt?.toDate?.() || new Date()
            });
          });
          setEnrolledCourses(courses);
          
          // Subscribe to course materials updates if realTimeService exists
          if (realTimeService && typeof realTimeService.subscribeToCourseMaterials === 'function') {
            const courseIds = courses.map(c => c.courseId);
            if (courseIds.length > 0) {
              const unsubscribeMaterials = realTimeService.subscribeToCourseMaterials(
                courseIds, 
                (materials) => {
                  setRealTimeData(prev => ({
                    ...prev,
                    materials
                  }));
                }
              );
            }
          }
        }, (error) => {
          console.error('Error fetching enrollments:', error);
          setError('Failed to load enrolled courses');
        });
        
        // 4. Subscribe to real-time notifications if service exists
        let unsubscribeNotifications;
        if (realTimeService && typeof realTimeService.subscribeToNotifications === 'function') {
          unsubscribeNotifications = realTimeService.subscribeToNotifications(
            (newNotifications) => {
              setNotifications(newNotifications);
              const unreadCount = newNotifications.filter(n => !n.read).length;
              setUnreadNotifications(unreadCount);
              
              // Show browser notifications for new unread notifications
              if ('Notification' in window && Notification.permission === 'granted') {
                newNotifications.forEach(notification => {
                  if (!notification.read) {
                    new Notification(notification.title || 'New Notification', {
                      body: notification.message,
                      icon: getNotificationIcon(notification.type),
                      data: {
                        url: getNotificationUrl(notification),
                        ...notification
                      }
                    });
                  }
                });
              }
            }
          );
        } else {
          // Fallback: Fetch notifications directly from Firestore
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('studentId', '==', studentProfile.studentId),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsList = [];
            snapshot.forEach((doc) => {
              notificationsList.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
              });
            });
            setNotifications(notificationsList);
            const unreadCount = notificationsList.filter(n => !n.read).length;
            setUnreadNotifications(unreadCount);
          });
        }
        
        // 5. Fetch assignments directly (fallback if realTimeService doesn't work)
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('studentId', '==', studentProfile.studentId),
          orderBy('dueDate', 'asc')
        );
        
        const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
          const assignments = [];
          snapshot.forEach((doc) => {
            const assignment = doc.data();
            assignments.push({
              id: doc.id,
              ...assignment,
              dueDate: assignment.dueDate?.toDate?.() || new Date(assignment.dueDate),
              createdAt: assignment.createdAt?.toDate?.() || new Date()
            });
          });
          setRealTimeData(prev => ({
            ...prev,
            assignments
          }));
          
          // Check for assignment reminders
          if ('Notification' in window && Notification.permission === 'granted') {
            assignments.forEach(assignment => {
              if (!assignment.submitted && assignment.dueDate) {
                const dueDate = assignment.dueDate;
                const now = new Date();
                const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
                
                // Show reminder if due within 24 hours
                if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
                  new Notification('⏰ Assignment Due Soon', {
                    body: `${assignment.title} is due in ${Math.round(hoursUntilDue)} hours`,
                    icon: '/icons/assignment.png'
                  });
                }
              }
            });
          }
        });
        
        // 6. Fetch grades directly
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', studentProfile.studentId),
          orderBy('gradedAt', 'desc')
        );
        
        const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
          const grades = [];
          snapshot.forEach((doc) => {
            const grade = doc.data();
            grades.push({
              id: doc.id,
              ...grade,
              gradedAt: grade.gradedAt?.toDate?.() || new Date(grade.gradedAt)
            });
          });
          setRealTimeData(prev => ({
            ...prev,
            grades
          }));
          
          // Show notifications for new grades
          if ('Notification' in window && Notification.permission === 'granted') {
            grades.forEach(grade => {
              const gradedAt = grade.gradedAt;
              const now = new Date();
              const minutesAgo = (now - gradedAt) / (1000 * 60);
              
              // Show notification if grade was added in last minute
              if (minutesAgo <= 1) {
                new Notification('📊 Grade Updated', {
                  body: `Your grade for ${grade.assignmentName || 'assignment'} is available`,
                  icon: '/icons/grade.png'
                });
              }
            });
          }
        });
        
        // 7. Fetch attendance
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentProfile.studentId),
          orderBy('date', 'desc'),
          limit(30)
        );
        
        const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
          const attendance = [];
          snapshot.forEach((doc) => {
            const att = doc.data();
            attendance.push({
              id: doc.id,
              ...att,
              date: att.date?.toDate?.() || new Date(att.date)
            });
          });
          
          setRealTimeData(prev => ({
            ...prev,
            attendance
          }));
        });
        
        setLoading(false);
        
        // Cleanup subscriptions
        return () => {
          unsubscribeEnrollments();
          if (unsubscribeNotifications) unsubscribeNotifications();
          unsubscribeAssignments();
          unsubscribeGrades();
          unsubscribeAttendance();
          if (realTimeService && typeof realTimeService.unsubscribeAll === 'function') {
            realTimeService.unsubscribeAll();
          }
        };
        
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchStudentData();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [studentId]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'assignment': return '/icons/assignment.png';
      case 'grade': return '/icons/grade.png';
      case 'announcement': return '/icons/announcement.png';
      case 'attendance': return '/icons/attendance.png';
      case 'resource': return '/icons/resource.png';
      default: return '/logo.png';
    }
  };

  const getNotificationUrl = (notification) => {
    switch(notification.type) {
      case 'assignment': return `/student/assignments/${notification.assignmentId}`;
      case 'grade': return '/student/grades';
      case 'announcement': return '/student/announcements';
      case 'attendance': return '/student/attendance';
      case 'resource': return '/student/resources';
      default: return '/student/notifications';
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Search query:', query);
  };

  const handleNotificationsClick = () => {
    setActiveSection('notifications');
  };

  const handleProfileClick = () => {
    setActiveSection('profile');
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
  };

  const handleLogout = () => {
    if (realTimeService && typeof realTimeService.unsubscribeAll === 'function') {
      realTimeService.unsubscribeAll();
    }
    navigate('/login');
  };

  const handleFileUpload = async (file, assignmentId, metadata) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', assignmentId);
      formData.append('studentId', studentData?.studentId);
      formData.append('metadata', JSON.stringify(metadata));
      
      console.log('Uploading file:', file.name, 'for assignment:', assignmentId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Assignment submitted successfully! (Demo)');
      return true;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment. Please try again.');
      return false;
    }
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      if (realTimeService && typeof realTimeService.markNotificationAsRead === 'function') {
        await realTimeService.markNotificationAsRead(notificationId);
      } else {
        console.log('Mark notification as read:', notificationId);
      }
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      if (realTimeService && typeof realTimeService.markAllNotificationsAsRead === 'function') {
        const result = await realTimeService.markAllNotificationsAsRead();
        if (result.success) {
          setUnreadNotifications(0);
        }
      } else {
        console.log('Mark all notifications as read');
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState message="Loading your dashboard..." type="spinner" />;
    }

    if (error) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800">Access Error</h3>
              <p className="text-red-700 mt-2">{error}</p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!studentData) {
      return <EmptyState message="No student data found" />;
    }

    switch (activeSection) {
      case 'dashboard':
        return (
          <StudentOverview 
            studentData={studentData} 
            enrolledCourses={enrolledCourses}
            assignments={realTimeData.assignments}
            grades={realTimeData.grades}
          />
        );
      case 'courses':
        return (
          <StudentCourses 
            studentId={studentData?.studentId} 
            enrolledCourses={enrolledCourses}
            materials={realTimeData.materials}
            onDownload={handleFileDownload}
          />
        );
      case 'grades':
        return (
          <StudentGrades 
            studentId={studentData?.studentId}
            grades={realTimeData.grades}
          />
        );
      case 'attendance':
        return (
          <StudentAttendance 
            studentId={studentData?.studentId}
            attendance={realTimeData.attendance}
          />
        );
      case 'assignments':
        return (
          <StudentAssignments 
            studentId={studentData?.studentId} 
            enrolledCourses={enrolledCourses}
            assignments={realTimeData.assignments}
            onUpload={handleFileUpload}
            onDownload={handleFileDownload}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            userType="student" 
            userId={studentData?.studentId} 
            showActions={false} 
          />
        );
      case 'resources':
        return (
          <StudentResources 
            studentId={studentData?.studentId} 
            enrolledCourses={enrolledCourses}
            materials={realTimeData.materials}
            onDownload={handleFileDownload}
          />
        );
      case 'profile':
        return (
          <StudentProfile 
            studentData={studentData}
            onUpdate={() => {
              window.location.reload();
            }}
          />
        );
      case 'analytics':
        return (
          <StudentAnalytics 
            studentId={studentData?.studentId}
            grades={realTimeData.grades}
            assignments={realTimeData.assignments}
          />
        );
      case 'notifications':
        return (
          <StudentNotifications 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          />
        );
      case 'reports':  // New case for term reports
        return (
         <StudentTermReports 
          studentId={studentData?.studentId} 
        />
      );
      default:
        return (
          <StudentOverview 
            studentData={studentData} 
            enrolledCourses={enrolledCourses}
            assignments={realTimeData.assignments}
            grades={realTimeData.grades}
          />
        );
    }
  };

  const getSectionTitle = (section) => {
    const titles = {
      dashboard: 'Student Dashboard',
      courses: 'My Courses',
      grades: 'Grades & Progress',
      attendance: 'Attendance',
      assignments: 'Assignments',
      resources: 'Learning Resources',
      profile: 'My Profile',
      analytics: 'Analytics',
      notifications: 'Notifications',
      calendar: 'Calendar'
    };
    return titles[section] || 'Student Portal';
  };

  // Sidebar sections
  const sidebarSections = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'grades', label: 'Grades', icon: <Award className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Users className="w-5 h-5" /> },
    { id: 'resources', label: 'Resources', icon: <Upload className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType="student"
        userName={studentData?.fullName || 'Student'}
        userRole="Student"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        sections={sidebarSections}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      
      <StudentHeader
        title={getSectionTitle(activeSection)}
        studentName={studentData?.fullName}
        studentAvatar={studentData?.avatar}
        notificationCount={unreadNotifications}
        onSearch={handleSearch}
        onNotificationsClick={handleNotificationsClick}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} px-4 sm:px-6 py-4 sm:py-8`}>
        <div className="lg:hidden h-16"></div>
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="flex justify-around items-center h-14">
          {[
            { id: 'dashboard', icon: '🏠', label: 'Home' },
            { id: 'courses', icon: '📚', label: 'Courses' },
            { id: 'assignments', icon: '📝', label: 'Assignments' },
            { id: 'grades', icon: '📊', label: 'Grades' },
            { id: 'profile', icon: '👤', label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                activeSection === tab.id ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;