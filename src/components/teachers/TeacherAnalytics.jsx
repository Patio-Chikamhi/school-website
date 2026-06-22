// components/teachers/TeacherAnalytics.jsx - SIMPLIFIED VERSION (No external charts)
import React, { useState } from 'react';
import { 
  TrendingUp, Users, BookOpen, Award, 
  Calendar, Download, Filter, Loader,
  Activity, Target, Clock, CheckCircle,
  BarChart3, PieChart, LineChart
} from 'lucide-react';

const TeacherAnalytics = ({ teacherId, performanceMetrics, teacherCourses }) => {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  // Sample data
  const gradeDistribution = [
    { grade: 'A (90-100%)', percentage: 15, color: 'bg-emerald-500' },
    { grade: 'B (80-89%)', percentage: 28, color: 'bg-blue-500' },
    { grade: 'C (70-79%)', percentage: 35, color: 'bg-yellow-500' },
    { grade: 'D (60-69%)', percentage: 15, color: 'bg-orange-500' },
    { grade: 'F (below 60%)', percentage: 7, color: 'bg-red-500' },
  ];

  const weeklyData = [
    { day: 'Mon', submitted: 45, graded: 33 },
    { day: 'Tue', submitted: 52, graded: 44 },
    { day: 'Wed', submitted: 48, graded: 33 },
    { day: 'Thu', submitted: 61, graded: 55 },
    { day: 'Fri', submitted: 58, graded: 48 },
  ];

  const totalStudents = performanceMetrics?.averageClassSize * teacherCourses.length || 0;
  const maxSubmissions = Math.max(...weeklyData.map(d => d.submitted));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your teaching performance and student progress</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {teacherCourses.map(course => (
              <option key={course.id} value={course.id}>{course.courseName}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="semester">This Semester</option>
          </select>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Average Grade</p>
              <p className="text-3xl font-bold">{performanceMetrics?.studentSatisfaction || 84}%</p>
            </div>
            <Award className="w-10 h-10 text-emerald-200" />
          </div>
          <div className="mt-3 text-emerald-100 text-xs">↑ 5% from last semester</div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold">{performanceMetrics?.completionRate || 87}%</p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-200" />
          </div>
          <div className="mt-3 text-blue-100 text-xs">↑ 8% from last semester</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Students</p>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-purple-200" />
          </div>
          <div className="mt-3 text-purple-100 text-xs">Across {teacherCourses.length} courses</div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Grading</p>
              <p className="text-3xl font-bold">{performanceMetrics?.pendingGrading || 0}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-200" />
          </div>
          <div className="mt-3 text-orange-100 text-xs">Requires attention</div>
        </div>
      </div>

      {/* Simple Bar Chart for Submissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Submissions</h3>
        <div className="space-y-3">
          {weeklyData.map((data) => (
            <div key={data.day}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{data.day}</span>
                <div className="flex gap-4">
                  <span className="text-emerald-600">Submitted: {data.submitted}</span>
                  <span className="text-blue-600">Graded: {data.graded}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2 text-white text-xs"
                      style={{ width: `${(data.submitted / maxSubmissions) * 100}%` }}
                    >
                      {data.submitted}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Distribution - Simple Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
        <div className="space-y-3">
          {gradeDistribution.map((item) => (
            <div key={item.grade}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.grade}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`${item.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Average</span>
                <span className="font-medium">{performanceMetrics?.studentSatisfaction || 84}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${performanceMetrics?.studentSatisfaction || 84}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Assignment Completion</span>
                <span className="font-medium">{performanceMetrics?.completionRate || 87}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${performanceMetrics?.completionRate || 87}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Attendance Rate</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Student Satisfaction</span>
                <span className="font-medium">4.8/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Performance Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
          <div className="space-y-4">
            {teacherCourses.slice(0, 4).map((course, idx) => (
              <div key={course.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{course.courseName}</p>
                    <p className="text-xs text-gray-500">Grade {course.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      {[88, 92, 85, 90][idx % 4]}%
                    </p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${[88, 92, 85, 90][idx % 4]}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Performance Growth</p>
              <p className="text-sm text-gray-600">Student performance has improved by 8% this semester</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Above Target</p>
              <p className="text-sm text-gray-600">Assignment completion rate exceeds semester goals</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Focus Areas</p>
              <p className="text-sm text-gray-600">Math concepts and essay writing need attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;