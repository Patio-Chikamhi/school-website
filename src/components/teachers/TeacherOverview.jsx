// components/teachers/TeacherOverview.jsx
import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Award,
  Bell,
  TrendingUp,
  UserPlus,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  Activity,
  Target,
  Star,
  BarChart3,
  PieChart
} from 'lucide-react';

// Import modals
import PostAssignmentModal from '../PostAssignmentModal';
import InputGradesModal from '../InputGradesModal';
import SendAnnouncementModal from '../SendAnnouncementModal';
import TakeAttendanceModal from '../TakeAttendanceModal';
import EnrollStudentsModal from '../EnrollStudentsModal';

const TeacherOverview = ({
  teacherData,
  teacherCourses,
  enrolledStudentsByCourse,
  performanceMetrics,
  students
}) => {
  const [activeModal, setActiveModal] = useState(null);
  
  const teacherName = teacherData?.fullName;
  const teacherId = teacherData?.uid;
  
  // Calculate statistics
  const totalStudents = Object.values(enrolledStudentsByCourse).reduce(
    (sum, students) => sum + students.length, 0
  );
  
  const averageEnrollment = teacherCourses.length > 0
    ? Math.round(totalStudents / teacherCourses.length)
    : 0;
  
  const fullCourses = teacherCourses.filter(course => {
    const enrolled = enrolledStudentsByCourse[course.id]?.length || 0;
    const capacity = course.capacity || 30;
    return enrolled >= capacity * 0.9;
  }).length;

  const openModal = (modalName) => {
    if (!teacherId) {
      alert('Please log in to use this feature');
      return;
    }
    
    if (modalName === 'enroll' && teacherCourses.length === 0) {
      alert('You have no courses assigned. Please contact the administrator.');
      return;
    }
    
    setActiveModal(modalName);
  };

  const getCourseStats = (courseId) => {
    const enrolled = enrolledStudentsByCourse[courseId]?.length || 0;
    const course = teacherCourses.find(c => c.id === courseId);
    const capacity = course?.capacity || 30;
    const percentage = Math.round((enrolled / capacity) * 100);
    
    return {
      enrolled,
      capacity,
      percentage,
      status: percentage >= 90 ? 'Full' : percentage >= 50 ? 'Moderate' : 'Available'
    };
  };

  const getEnrollmentColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-100 text-red-700';
    if (percentage >= 75) return 'bg-orange-100 text-orange-700';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 80) return 'from-blue-500 to-blue-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-orange-500 to-orange-600';
  };

  const safeNumber = (num) => num || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {teacherName}!</h1>
            <p className="text-white/90">
              Here's your teaching overview for this semester. You're doing amazing work!
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
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
              {teacherName?.charAt(0)?.toUpperCase() || 'T'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{safeNumber(teacherCourses.length)}</div>
              <div className="text-sm text-gray-500 mt-1">My Courses</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Full classes</span>
              <span className="font-medium">{safeNumber(fullCourses)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full" 
                style={{ width: teacherCourses.length > 0 ? `${(fullCourses / teacherCourses.length) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{safeNumber(totalStudents)}</div>
              <div className="text-sm text-gray-500 mt-1">Total Students</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Avg per class</span>
              <span className="font-medium">{safeNumber(averageEnrollment)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min((averageEnrollment / 30) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{safeNumber(performanceMetrics.pendingGrading)}</div>
              <div className="text-sm text-gray-500 mt-1">Pending Tasks</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Require grading</span>
              <span className="font-medium">{safeNumber(performanceMetrics.pendingGrading)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-purple-500 h-1.5 rounded-full" 
                style={{ width: performanceMetrics.totalAssignments > 0 ? `${(performanceMetrics.pendingGrading / performanceMetrics.totalAssignments) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{safeNumber(performanceMetrics.studentSatisfaction)}%</div>
              <div className="text-sm text-gray-500 mt-1">Performance</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Student satisfaction</span>
              <span className="font-medium">{safeNumber(performanceMetrics.studentSatisfaction)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full" 
                style={{ width: `${performanceMetrics.studentSatisfaction}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="text-sm text-gray-500">Most used tools</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              id: 'enroll',
              label: 'Enroll Students',
              subLabel: 'Manage class enrollment',
              icon: <UserPlus className="w-8 h-8 text-indigo-600" />,
              color: 'indigo',
              disabled: teacherCourses.length === 0
            },
            {
              id: 'assignment',
              label: 'Post Assignment',
              subLabel: 'Create new assignments',
              icon: <FileText className="w-8 h-8 text-emerald-600" />,
              color: 'emerald',
              disabled: teacherCourses.length === 0
            },
            {
              id: 'grades',
              label: 'Input Grades',
              subLabel: 'Record student grades',
              icon: <Award className="w-8 h-8 text-blue-600" />,
              color: 'blue',
              disabled: teacherCourses.length === 0
            },
            {
              id: 'announcement',
              label: 'Send Announcement',
              subLabel: 'Communicate with class',
              icon: <Bell className="w-8 h-8 text-purple-600" />,
              color: 'purple',
              disabled: teacherCourses.length === 0
            },
            {
              id: 'attendance',
              label: 'Take Attendance',
              subLabel: 'Mark student attendance',
              icon: <Users className="w-8 h-8 text-yellow-600" />,
              color: 'yellow',
              disabled: teacherCourses.length === 0
            },
          ].map((action) => (
            <button 
              key={action.id}
              onClick={() => openModal(action.id)}
              disabled={action.disabled}
              className={`group p-6 rounded-2xl transition-all duration-300 border-2 flex flex-col items-center justify-center gap-4 ${
                action.disabled
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `border-${action.color}-100 bg-gradient-to-b from-${action.color}-50 to-white hover:border-${action.color}-300 hover:shadow-xl hover:-translate-y-1`
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                action.disabled
                  ? 'bg-gray-200'
                  : `bg-${action.color}-100 group-hover:bg-${action.color}-200`
              }`}>
                {action.icon}
              </div>
              <div>
                <span className={`block font-semibold ${
                  action.disabled ? 'text-gray-500' : 'text-gray-900'
                }`}>{action.label}</span>
                <span className="block text-xs text-gray-500 mt-1">{action.subLabel}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Courses Overview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">My Courses</h3>
              <p className="text-sm text-gray-600 mt-1">
                {safeNumber(teacherCourses.length)} courses assigned • {safeNumber(totalStudents)} total students
              </p>
            </div>
          </div>
        </div>
        
        {teacherCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Assigned</h3>
            <p className="text-gray-600">
              You haven't been assigned any courses yet. Please contact the school administrator.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teacherCourses.slice(0, 5).map((course) => {
              const stats = getCourseStats(course.id);
              const enrollmentPercentage = stats.percentage;
              
              return (
                <div key={course.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          enrollmentPercentage >= 90 ? 'bg-red-100' :
                          enrollmentPercentage >= 50 ? 'bg-yellow-100' :
                          'bg-emerald-100'
                        }`}>
                          <span className={`font-bold ${
                            enrollmentPercentage >= 90 ? 'text-red-600' :
                            enrollmentPercentage >= 50 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`}>
                            {course.courseId?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{course.courseName}</h4>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {course.courseId}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-sm text-gray-600">Grade {course.grade}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{stats.enrolled} students</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getEnrollmentColor(enrollmentPercentage)}`}>
                              {stats.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enrollment Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Enrollment Progress</span>
                          </div>
                          <span className={`text-sm font-semibold ${
                            enrollmentPercentage >= 90 ? 'text-red-600' :
                            enrollmentPercentage >= 50 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`}>
                            {enrollmentPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              enrollmentPercentage >= 90 ? 'bg-red-500' :
                              enrollmentPercentage >= 50 ? 'bg-yellow-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{stats.enrolled} enrolled</span>
                          <span>{stats.capacity} capacity</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => openModal('enroll')}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Modals */}
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

export default TeacherOverview;