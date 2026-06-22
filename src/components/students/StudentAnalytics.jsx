import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Calendar,
  BookOpen,
  Users,
  Clock,
  PieChart,
  LineChart,
  Download,
  Filter,
  ChevronDown,
  Eye,
  Star,
  TrendingDown
} from 'lucide-react';

const StudentAnalytics = ({ studentId }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);

  // Mock data - Replace with actual Firestore data
  const analyticsData = {
    overallProgress: 78,
    gradeTrend: 12.5,
    attendanceRate: 95,
    assignmentCompletion: 88,
    
    monthlyGrades: [
      { month: 'Jan', grade: 82 },
      { month: 'Feb', grade: 85 },
      { month: 'Mar', grade: 88 },
      { month: 'Apr', grade: 90 },
      { month: 'May', grade: 92 },
      { month: 'Jun', grade: 89 },
    ],
    
    subjectPerformance: [
      { subject: 'Mathematics', grade: 92, trend: 'up' },
      { subject: 'Science', grade: 88, trend: 'up' },
      { subject: 'English', grade: 85, trend: 'stable' },
      { subject: 'History', grade: 90, trend: 'up' },
      { subject: 'Geography', grade: 78, trend: 'down' },
    ],
    
    timeSpent: {
      studying: 25,
      assignments: 15,
      projects: 10,
      revision: 5,
    },
    
    weeklyActivity: [
      { day: 'Mon', hours: 4.5 },
      { day: 'Tue', hours: 5.2 },
      { day: 'Wed', hours: 3.8 },
      { day: 'Thu', hours: 6.1 },
      { day: 'Fri', hours: 4.3 },
      { day: 'Sat', hours: 2.7 },
      { day: 'Sun', hours: 1.5 },
    ],
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 text-yellow-600">-</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your academic progress and performance insights
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          <button className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{analyticsData.overallProgress}%</div>
              <div className="text-sm opacity-90 mt-1">Overall Progress</div>
            </div>
            <BarChart3 className="w-10 h-10 opacity-80" />
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-4">
            <div 
              className="bg-white h-2 rounded-full" 
              style={{ width: `${analyticsData.overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`text-right ${getTrendColor(analyticsData.gradeTrend)}`}>
              <div className="text-3xl font-bold">+{analyticsData.gradeTrend}%</div>
              <div className="text-sm">Grade Trend</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">Improved from last month</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{analyticsData.attendanceRate}%</div>
              <div className="text-sm text-gray-500">Attendance Rate</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${analyticsData.attendanceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-600">{analyticsData.assignmentCompletion}%</div>
              <div className="text-sm text-gray-500">Assignments Completed</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full" 
              style={{ width: `${analyticsData.assignmentCompletion}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts and Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Grade Progress Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>12.5% improvement</span>
            </div>
          </div>
          
          <div className="h-64">
            {/* Chart container */}
            <div className="flex items-end justify-between h-48 mt-4">
              {analyticsData.monthlyGrades.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-10 bg-gradient-to-t from-emerald-400 to-emerald-600 rounded-t-lg"
                    style={{ height: `${item.grade * 0.8}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">{item.month}</div>
                  <div className="text-sm font-medium text-gray-900">{item.grade}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Subject Performance</h3>
          
          <div className="space-y-4">
            {analyticsData.subjectPerformance.map((subject, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{subject.subject}</div>
                    <div className="text-sm text-gray-500">Grade: {subject.grade}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subject.grade >= 90 ? 'bg-emerald-100 text-emerald-800' :
                    subject.grade >= 80 ? 'bg-blue-100 text-blue-800' :
                    subject.grade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {subject.grade}%
                  </div>
                  {getTrendIcon(subject.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Spent Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Time Spent Distribution</h3>
          
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              {/* Pie chart segments */}
              <div className="absolute inset-0 rounded-full border-8 border-emerald-500"></div>
              <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'inset(0 0 0 50%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-amber-500" style={{ clipPath: 'inset(50% 0 0 0)' }}></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-900">55h</div>
                <div className="text-sm text-gray-500">Total Study Time</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-sm text-gray-700">Studying: {analyticsData.timeSpent.studying}h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Assignments: {analyticsData.timeSpent.assignments}h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Projects: {analyticsData.timeSpent.projects}h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-sm text-gray-700">Revision: {analyticsData.timeSpent.revision}h</span>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Weekly Activity</h3>
            <div className="text-sm text-gray-500">Average: 4.1h/day</div>
          </div>
          
          <div className="h-64">
            <div className="flex items-end justify-between h-48 mt-4">
              {analyticsData.weeklyActivity.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-lg"
                    style={{ height: `${day.hours * 20}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">{day.day}</div>
                  <div className="text-sm font-medium text-gray-900">{day.hours}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Performance Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Strengths</div>
                <div className="text-sm text-gray-500">Subjects you excel in</div>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span>Mathematics</span>
                <span className="font-medium text-emerald-600">92%</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>History</span>
                <span className="font-medium text-emerald-600">90%</span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Areas to Improve</div>
                <div className="text-sm text-gray-500">Focus on these subjects</div>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span>Geography</span>
                <span className="font-medium text-red-600">78%</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>English</span>
                <span className="font-medium text-yellow-600">85%</span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Study Recommendations</div>
                <div className="text-sm text-gray-500">Suggested actions</div>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">Increase Geography study time by 2h/week</li>
              <li className="text-sm text-gray-600">Review English assignments more thoroughly</li>
              <li className="text-sm text-gray-600">Maintain Mathematics practice schedule</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;