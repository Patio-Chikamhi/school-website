import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Users
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { StatsCard } from '../dashboard/StatsCard';

const StudentOverview = ({ studentData, enrolledCourses }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0
  });
  
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!studentData?.studentId) return;

      try {
        // Fetch assignments
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('studentId', '==', studentData.studentId),
          orderBy('dueDate', 'asc'),
          limit(5)
        );
        
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignments = assignmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate()
        }));
        
        const now = new Date();
        const pending = assignments.filter(a => 
          a.dueDate > now && !a.submitted
        ).length;
        const overdue = assignments.filter(a => 
          a.dueDate < now && !a.submitted
        ).length;
        const completed = assignments.filter(a => a.submitted).length;
        
        setUpcomingAssignments(assignments.slice(0, 3));
        
        // Fetch grades
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', studentData.studentId),
          orderBy('gradedAt', 'desc'),
          limit(3)
        );
        
        const gradesSnapshot = await getDocs(gradesQuery);
        const grades = gradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          gradedAt: doc.data().gradedAt?.toDate()
        }));
        
        setRecentGrades(grades);
        
        // Calculate average grade
        const numericGrades = grades
          .filter(g => g.percentage || g.gradeValue)
          .map(g => g.percentage || g.gradeValue);
        
        const averageGrade = numericGrades.length > 0
          ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
          : 0;
        
        // Fetch attendance (mock data for now)
        const attendanceRate = 95; // This should come from Firestore
        
        setStats({
          totalCourses: enrolledCourses.length,
          averageGrade: parseFloat(averageGrade),
          attendanceRate,
          pendingAssignments: pending,
          completedAssignments: completed,
          overdueAssignments: overdue
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [studentData, enrolledCourses]);

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'from-emerald-500 to-emerald-600';
    if (grade >= 80) return 'from-blue-500 to-blue-600';
    if (grade >= 70) return 'from-yellow-500 to-yellow-600';
    if (grade >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getUrgencyColor = (dueDate) => {
    if (!dueDate) return 'bg-gray-100 text-gray-800';
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'bg-red-100 text-red-800';
    if (daysUntilDue === 0) return 'bg-orange-100 text-orange-800';
    if (daysUntilDue <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {studentData?.fullName}!</h1>
            <p className="text-white/90 mb-4">
              You have {stats.pendingAssignments} assignments pending. 
              {stats.overdueAssignments > 0 && ` ${stats.overdueAssignments} are overdue.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-sm">{stats.totalCourses} Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">Avg. Grade: {stats.averageGrade}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Attendance: {stats.attendanceRate}%</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {studentData?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          subtitle="Enrolled this semester"
          color="from-emerald-500 to-emerald-600"
          details={[
            { label: 'Active', value: `${stats.totalCourses}` },
            { label: 'Completed', value: '0' },
            { label: 'Status', value: 'Enrolled' }
          ]}
        />

        <StatsCard
          title="Average Grade"
          value={`${stats.averageGrade}%`}
          icon={Award}
          subtitle="Overall performance"
          color={getGradeColor(stats.averageGrade)}
          details={[
            { label: 'Trend', value: stats.averageGrade >= 80 ? 'Excellent' : 'Good' },
            { label: 'Rank', value: 'Top 20%' }
          ]}
        />

        <StatsCard
          title="Assignments"
          value={stats.pendingAssignments}
          icon={FileText}
          subtitle="Require attention"
          color="from-blue-500 to-blue-600"
          details={[
            { label: 'Overdue', value: `${stats.overdueAssignments}` },
            { label: 'Completed', value: `${stats.completedAssignments}` },
            { label: 'Total', value: `${stats.pendingAssignments + stats.completedAssignments}` }
          ]}
        />

        <StatsCard
          title="Attendance"
          value={`${stats.attendanceRate}%`}
          icon={Calendar}
          subtitle="This semester"
          color="from-purple-500 to-purple-600"
          details={[
            { label: 'Days Present', value: '45' },
            { label: 'Days Absent', value: '2' },
            { label: 'On Time', value: '95%' }
          ]}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Assignments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upcoming Assignments</h3>
                <p className="text-sm text-gray-500">Due dates and priorities</p>
              </div>
              <Link to="/student/assignments" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming assignments</p>
                <p className="text-sm text-gray-400 mt-1">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.courseName || 'General'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(assignment.dueDate)}`}>
                        {assignment.dueDate ? (
                          assignment.dueDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        ) : 'No due date'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due in 2 days
                        </span>
                        <span>{assignment.points || 100} points</span>
                      </div>
                      <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                        Start Assignment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Grades & Quick Links */}
        <div className="space-y-6">
          {/* Recent Grades */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Grades</h3>
            
            {recentGrades.length === 0 ? (
              <div className="text-center py-4">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No grades recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{grade.assignmentName || 'Assignment'}</div>
                      <div className="text-sm text-gray-500">{grade.courseName}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        (grade.percentage || grade.gradeValue) >= 90 ? 'text-emerald-600' :
                        (grade.percentage || grade.gradeValue) >= 80 ? 'text-blue-600' :
                        (grade.percentage || grade.gradeValue) >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {grade.percentage || grade.gradeValue}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {grade.gradedAt?.toLocaleDateString() || 'Recently'}
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center gap-2 hover:bg-emerald-50 py-2 rounded-lg transition-colors">
                  View All Grades <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <div className="space-y-3">
              {[
                { label: 'Course Materials', icon: '📚', color: 'emerald' },
                { label: 'Submit Assignment', icon: '📤', color: 'blue' },
                { label: 'View Schedule', icon: '📅', color: 'purple' },
                { label: 'Academic Calendar', icon: '🗓️', color: 'orange' },
              ].map((link, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;