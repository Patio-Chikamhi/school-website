// components/teachers/TeacherDashboard.jsx - COMPLETELY FIXED
import React, { useState, useEffect, useCallback } from 'react';
import PostAssignmentModal from '../PostAssignmentModal';
import InputGradesModal from '../InputGradesModal';
import SendAnnouncementModal from '../SendAnnouncementModal';
import TakeAttendanceModal from '../TakeAttendanceModal';
import EnrollStudentsModal from '../EnrollStudentsModal';
import TeacherCourses from './TeacherCourses';
import TeacherStudents from './TeacherStudents';
import TeacherAttendance from './TeacherAttendance';
import TeacherGrades from './TeacherGrades';
import { 
  BookOpen, Award, Megaphone, Users, UserPlus, UserCheck, Filter,
  Calendar, Clock, Bell, Home, ChevronRight, ChevronDown, Search,
  BarChart, Download, Settings, Sparkles, GraduationCap, MessageSquare,
  Eye, Edit, MoreVertical, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Bookmark, Star, Shield, Zap, Target, Briefcase,
  FileText, CalendarDays, DownloadCloud, TrendingDown, UsersIcon,
  BarChart3, PieChart, Activity, TargetIcon, Coffee, RefreshCw, Info,
  Menu, LogOut, User, Bell as BellIcon, Upload, FileSpreadsheet
} from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import TeacherMaterials from './TeacherMaterials';
import TeacherReports from './TeacherReports';
import TeacherTermReports from './TeacherTermReport';
import TeacherAssignments from './TeacherAssignments';
import PublishedReportsViewer from '../shared/PublishedReportsViewer';

import { Sidebar } from '../dashboard/Sidebar';
import { TopHeader } from '../dashboard/TopHeader';
import { StatsCard } from '../dashboard/StatsCard';
import { LoadingState } from '../dashboard/LoadingState';
import { EmptyState } from '../dashboard/EmptyState';

const TeacherDashboard = ({ currentUser, courses, students }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [enrolledCounts, setEnrolledCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [enrolledStudentsByCourse, setEnrolledStudentsByCourse] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const teacherName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Teacher';
  const teacherId = currentUser?.uid;
  
  // Filter courses for this teacher
  const teacherAssignedCourses = React.useMemo(() => {
    if (!courses || !teacherId) return [];
    
    console.log('🔍 Filtering courses for teacher ID:', teacherId);
    console.log('📚 Total courses:', courses.length);
    
    const assigned = courses.filter(course => {
      if (course.isActive === false) return false;
      if (course.teacherId === teacherId) return true;
      if (course.teacherIds && Array.isArray(course.teacherIds) && course.teacherIds.includes(teacherId)) {
        return true;
      }
      return false;
    });
    
    console.log(`📚 Found ${assigned.length} assigned courses:`, assigned.map(c => c.courseName));
    return assigned;
  }, [courses, teacherId]);
  
  const filteredCourses = React.useMemo(() => {
    if (!teacherAssignedCourses.length) return [];
    let filtered = [...teacherAssignedCourses];
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.grade?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [teacherAssignedCourses, searchQuery]);
  
  const teacherCourses = React.useMemo(() => {
    if (filterStatus === 'all') return filteredCourses;
    return filteredCourses.filter(course => {
      const enrolled = enrolledCounts[course.id] || 0;
      const capacity = course.capacity || 30;
      const percentage = Math.round((enrolled / capacity) * 100);
      if (filterStatus === 'full' && percentage >= 90) return true;
      if (filterStatus === 'available' && percentage < 50) return true;
      if (filterStatus === 'moderate' && percentage >= 50 && percentage < 90) return true;
      return false;
    });
  }, [filteredCourses, filterStatus, enrolledCounts]);

  // Fetch enrollment data
  useEffect(() => {
    if (!teacherId || !teacherAssignedCourses.length) {
      setEnrolledCounts({});
      setEnrolledStudentsByCourse({});
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const counts = {};
      const enrolledStudentsMap = {};
      
      try {
        for (const course of teacherAssignedCourses) {
          if (!isMounted) break;
          
          try {
            const enrollmentsQuery = query(
              collection(db, 'enrollments'),
              where('courseId', '==', course.id),
              where('status', '==', 'active')
            );
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            counts[course.id] = enrollmentsSnapshot.size;
            
            const enrolledStudentsList = [];
            for (const enrollmentDoc of enrollmentsSnapshot.docs) {
              const enrollment = enrollmentDoc.data();
              const studentQuery = query(
                collection(db, 'students'),
                where('studentId', '==', enrollment.studentId)
              );
              const studentSnapshot = await getDocs(studentQuery);
              
              if (!studentSnapshot.empty) {
                enrolledStudentsList.push({
                  id: studentSnapshot.docs[0].id,
                  ...studentSnapshot.docs[0].data(),
                  enrollmentId: enrollmentDoc.id,
                  enrolledAt: enrollment.enrolledAt?.toDate?.() || new Date(),
                  status: enrollment.status
                });
              } else {
                enrolledStudentsList.push({
                  studentId: enrollment.studentId,
                  studentName: enrollment.studentName,
                  fullName: enrollment.studentName,
                  enrollmentId: enrollmentDoc.id,
                  enrolledAt: enrollment.enrolledAt?.toDate?.() || new Date(),
                  status: enrollment.status
                });
              }
            }
            enrolledStudentsMap[course.id] = enrolledStudentsList;
            console.log(`📚 Course ${course.courseName}: ${enrollmentsSnapshot.size} students enrolled`);
          } catch (error) {
            console.error(`Error fetching data for course ${course.id}:`, error);
            counts[course.id] = 0;
            enrolledStudentsMap[course.id] = [];
          }
        }
        
        if (!isMounted) return;
        setEnrolledCounts(counts);
        setEnrolledStudentsByCourse(enrolledStudentsMap);
        
        const totalStudents = Object.values(counts).reduce((a, b) => a + b, 0);
        setPerformanceMetrics({
          totalAssignments: 0,
          pendingGrading: 0,
          averageClassSize: Math.round(totalStudents / teacherAssignedCourses.length) || 0,
          studentSatisfaction: 92,
          completionRate: 85
        });
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [teacherId, teacherAssignedCourses]);

  const openModal = useCallback((modalName) => {
    if (!teacherId) {
      alert('Please log in to use this feature');
      return;
    }
    if (modalName === 'enroll' && teacherAssignedCourses.length === 0) {
      alert('You have no courses assigned. Please contact the administrator.');
      return;
    }
    setActiveModal(modalName);
  }, [teacherId, teacherAssignedCourses.length]);

  const statistics = React.useMemo(() => {
    const totalStudents = Object.values(enrolledCounts).reduce((a, b) => a + b, 0);
    const averageEnrollment = teacherAssignedCourses.length > 0 
      ? Math.round(totalStudents / teacherAssignedCourses.length) : 0;
    const fullCourses = teacherAssignedCourses.filter(course => {
      const enrolled = enrolledCounts[course.id] || 0;
      const capacity = course.capacity || 30;
      return enrolled >= capacity * 0.9;
    }).length;
    return { totalStudents, averageEnrollment, fullCourses };
  }, [enrolledCounts, teacherAssignedCourses]);

  const { totalStudents, averageEnrollment, fullCourses } = statistics;
  const safeNumber = (num) => num || 0;

  const handleSearch = (query) => setSearchQuery(query);
  const handleNotificationsClick = () => console.log('Notifications clicked');
  const handleSettingsClick = () => setActiveSection('settings');

  const renderMainContent = () => {
    if (activeSection !== 'dashboard') {
      switch (activeSection) {
        case 'courses':
          return (
            <TeacherCourses 
              teacherId={teacherId}
              teacherCourses={teacherCourses}
              enrolledStudentsByCourse={enrolledStudentsByCourse}
              onEnrollStudents={(course) => openModal('enroll')}
              onEditCourse={(course) => console.log('Edit course:', course.courseName)}
            />
          );
        case 'students':
          return (
            <TeacherStudents 
              teacherId={teacherId}
              teacherCourses={teacherCourses}
              enrolledStudentsByCourse={enrolledStudentsByCourse}
              students={students}
            />
          );
        case 'attendance':
          return (
            <TeacherAttendance 
              teacherId={teacherId}
              teacherCourses={teacherCourses}
              enrolledStudentsByCourse={enrolledStudentsByCourse}
            />
          );
        case 'grades':
          return (
            <TeacherGrades 
              teacherId={teacherId}
              teacherCourses={teacherCourses}
              enrolledStudentsByCourse={enrolledStudentsByCourse}
            />
          );
        case 'materials':
          return (
            <TeacherMaterials 
              teacherId={teacherId} 
              teacherCourses={teacherCourses} 
              enrolledStudentsByCourse={enrolledStudentsByCourse}
            />
          );
        case 'studentReports':
          return (
            <TeacherReports 
              teacherId={teacherId} 
              teacherCourses={teacherCourses} 
              enrolledStudentsByCourse={enrolledStudentsByCourse}
            />
          );
        case 'termReports':  // New case
      return (
        <TeacherTermReports 
          teacherId={teacherId} 
          teacherCourses={teacherCourses} 
          enrolledStudentsByCourse={enrolledStudentsByCourse}
        />
      ); 
      case 'publishedReports':
  return (
    <PublishedReportsViewer 
      userType="teacher"
      teacherId={teacherId}
    />
  );
      case 'assignments':
        return (
       <TeacherAssignments 
         teacherId={teacherId}
         teacherCourses={teacherCourses}
         enrolledStudentsByCourse={enrolledStudentsByCourse}
       />
      );
        default:
          return renderDashboardOverview();
      }
    }
    return renderDashboardOverview();
  };

  const renderDashboardOverview = () => {
    if (isLoading) return <LoadingState message="Loading dashboard..." type="spinner" />;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome back, {teacherName}!</h1>
              <p className="text-white/90">Here's your teaching overview for this semester.</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-sm">{safeNumber(teacherCourses.length)} Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">{safeNumber(totalStudents)} Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Teacher ID: {teacherId?.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {teacherName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="My Courses"
            value={safeNumber(teacherCourses.length)}
            icon={BookOpen}
            color="from-emerald-500 to-emerald-600"
            subtitle="Assigned to you"
            details={[
              { label: 'Full Classes', value: `${safeNumber(fullCourses)}` },
              { label: 'Active', value: `${safeNumber(teacherCourses.length)}` }
            ]}
            onClick={() => setActiveSection('courses')}
          />
          <StatsCard
            title="Total Students"
            value={safeNumber(totalStudents)}
            icon={Users}
            color="from-blue-500 to-blue-600"
            subtitle="Across all classes"
            details={[
              { label: 'Avg per class', value: `${safeNumber(averageEnrollment)}` },
              { label: 'Full classes', value: `${safeNumber(fullCourses)}` }
            ]}
            onClick={() => setActiveSection('students')}
          />
          <StatsCard
            title="Pending Tasks"
            value={safeNumber(performanceMetrics?.pendingGrading)}
            icon={Bell}
            color="from-purple-500 to-purple-600"
            subtitle="Require attention"
            details={[
              { label: 'Grading', value: `${safeNumber(performanceMetrics?.pendingGrading)}` },
              { label: 'Attendance', value: '2' }
            ]}
            onClick={() => setActiveModal('grades')}
          />
          <StatsCard
            title="Performance"
            value={`${safeNumber(performanceMetrics?.studentSatisfaction)}%`}
            icon={TrendingUp}
            color="from-purple-500 to-purple-600"
            subtitle="Student satisfaction"
            details={[
              { label: 'Completion Rate', value: `${safeNumber(performanceMetrics?.completionRate)}%` },
              { label: 'Trend', value: 'Improving' }
            ]}
            onClick={() => setActiveSection('analytics')}
          />
        </div>

        {teacherCourses.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ No courses found. Your teacher ID is: {teacherId}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Sidebar sections - UPDATED with ALL sections
  const sidebarSections = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'students', label: 'Students', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" /> },
    { id: 'grades', label: 'Grades', icon: <Award className="w-5 h-5" /> },
    { id: 'materials', label: 'Course Materials', icon: <Upload className="w-5 h-5" /> },
    { id: 'reports', label: 'Student Reports', icon: <FileText className="w-5 h-5" /> },
  ];

  // Mobile bottom navigation - UPDATED
  const mobileNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'courses', icon: BookOpen, label: 'Courses' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'materials', icon: Upload, label: 'Materials' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  userType="teacher"
  userName={teacherName}
  userRole="Teacher"
  collapsed={sidebarCollapsed}
  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
  isMobileOpen={isMobileMenuOpen}
  onMobileClose={() => setIsMobileMenuOpen(false)}
/>
      
      <TopHeader
  title="Teacher Portal"
  subtitle="Welcome"
  userName={teacherName}
  onSearch={handleSearch}
  onNotificationsClick={handleNotificationsClick}
  onSettingsClick={handleSettingsClick}
  onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  isMobileMenuOpen={isMobileMenuOpen}
/>

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} px-6 py-8`}>
        <div className="lg:hidden h-16"></div>
        {renderMainContent()}
      </main>

      {/* Mobile Bottom Navigation - FIXED */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex flex-col items-center justify-center w-20 h-16 ${
                activeSection === tab.id ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'enroll' && (
        <EnrollStudentsModal
          teacherId={teacherId}
          teacherName={teacherName}
          courses={teacherCourses}
          students={students}
          enrolledStudents={enrolledStudentsByCourse}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'assignment' && (
        <PostAssignmentModal
          teacherId={teacherId}
          teacherName={teacherName}
          courses={teacherCourses}
          enrolledStudents={enrolledStudentsByCourse}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'grades' && (
        <InputGradesModal
          teacherId={teacherId}
          teacherName={teacherName}
          courses={teacherCourses}
          enrolledStudents={enrolledStudentsByCourse}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'announcement' && (
        <SendAnnouncementModal
          teacherId={teacherId}
          teacherName={teacherName}
          courses={teacherCourses}
          enrolledStudents={enrolledStudentsByCourse}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'attendance' && (
        <TakeAttendanceModal
          teacherId={teacherId}
          teacherName={teacherName}
          courses={teacherCourses}
          enrolledStudents={enrolledStudentsByCourse}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;