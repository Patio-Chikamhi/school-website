// components/students/StudentAttendance.jsx - COMPLETELY FIXED
import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart3,
  Target,
  Users,
  UserCheck,
  Calendar,
  Award,
  Loader,
  BookOpen,
  School
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentAttendance = ({ studentId, enrolledCourses }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [viewMode, setViewMode] = useState('calendar');
  const [actualStudentId, setActualStudentId] = useState(null);
  const [coursesAttendance, setCoursesAttendance] = useState({});

  // Get the actual student ID from the users collection
  useEffect(() => {
    const getStudentIdentifier = async () => {
      if (!studentId) return;
      
      try {
        const userDocRef = doc(db, 'users', studentId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const foundStudentId = userData.studentId || userData.studentDocumentId || studentId;
          setActualStudentId(foundStudentId);
          console.log('📍 Found student identifier:', foundStudentId);
        } else {
          setActualStudentId(studentId);
        }
      } catch (error) {
        console.error('Error getting student ID:', error);
        setActualStudentId(studentId);
      }
    };
    
    getStudentIdentifier();
  }, [studentId]);

  // Fetch attendance data - FIXED (removed orderBy to avoid index requirement)
  // Fetch attendance data - FIXED for individual record structure
useEffect(() => {
  const fetchAttendanceData = async () => {
    if (!actualStudentId) return;

    try {
      setLoading(true);
      console.log('📋 Fetching attendance for student ID:', actualStudentId);
      
      // ✅ FIX: Query attendance directly by studentId
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', actualStudentId)  // Direct match on studentId field
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      console.log(`📋 Found ${attendanceSnapshot.size} attendance records for student`);
      
      const attendanceData = [];
      const courseStats = {};
      
      attendanceSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Parse the date safely
        let recordDate;
        if (data.date) {
          if (typeof data.date === 'string') {
            recordDate = new Date(data.date);
          } else if (data.date.toDate) {
            recordDate = data.date.toDate();
          } else {
            recordDate = new Date(data.date);
          }
        } else if (data.recordedAt) {
          if (data.recordedAt.toDate) {
            recordDate = data.recordedAt.toDate();
          } else {
            recordDate = new Date(data.recordedAt);
          }
        } else {
          recordDate = new Date();
        }
        
        // Skip invalid dates
        if (isNaN(recordDate.getTime())) {
          console.warn('Invalid date found:', data.date);
          return;
        }
        
        const courseName = data.courseName || 'General';
        const status = data.status || 'present';
        
        attendanceData.push({
          id: doc.id,
          date: recordDate,
          dateString: data.date,
          status: status,
          remarks: data.remarks || '',
          courseId: data.courseId,
          courseName: courseName,
          teacherId: data.teacherId,
          teacherName: data.teacherName || 'Teacher',
          period: data.period || data.timeSlot || 'Regular',
          recordedAt: data.recordedAt
        });
        
        // Track per-course statistics
        if (!courseStats[courseName]) {
          courseStats[courseName] = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendanceRate: 0
          };
        }
        
        courseStats[courseName].total++;
        if (status === 'present') courseStats[courseName].present++;
        if (status === 'absent') courseStats[courseName].absent++;
        if (status === 'late') courseStats[courseName].late++;
        courseStats[courseName].attendanceRate = 
          (courseStats[courseName].present / courseStats[courseName].total * 100).toFixed(1);
      });
      
      // Sort by date (newest first)
      attendanceData.sort((a, b) => b.date - a.date);
      
      console.log(`✅ Processed ${attendanceData.length} attendance records for student`);
      console.log(`📊 Per-course stats:`, courseStats);
      
      setAttendance(attendanceData);
      setCoursesAttendance(courseStats);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchAttendanceData();
}, [actualStudentId]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (attendance.length === 0) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        excusedDays: 0,
        attendanceRate: 0,
        streak: 0,
        bestStreak: 0,
        monthlyAverage: 0,
        coursesCount: 0
      };
    }

    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const excusedDays = attendance.filter(a => a.status === 'excused').length;
    const attendanceRate = attendance.length > 0 ? (presentDays / attendance.length * 100).toFixed(1) : 0;
    
    // Calculate current streak (consecutive present days)
    let currentStreak = 0;
    let bestStreak = 0;
    const sortedAsc = [...attendance].sort((a, b) => a.date - b.date);
    
    for (const record of sortedAsc) {
      if (record.status === 'present') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (record.status === 'absent') {
        currentStreak = 0;
      }
    }
    
    // Calculate recent streak
    let recentStreak = 0;
    const sortedDesc = [...attendance].sort((a, b) => b.date - a.date);
    for (const record of sortedDesc) {
      if (record.status === 'present') {
        recentStreak++;
      } else if (record.status === 'absent') {
        break;
      }
    }
    
    // Monthly average
    const currentMonthAttendance = attendance.filter(a => 
      a.date.getMonth() === new Date().getMonth() && 
      a.date.getFullYear() === new Date().getFullYear()
    );
    const currentMonthPresent = currentMonthAttendance.filter(a => a.status === 'present').length;
    const monthlyAverage = currentMonthAttendance.length > 0 
      ? (currentMonthPresent / currentMonthAttendance.length * 100).toFixed(1)
      : 0;
    
    return {
      totalDays: attendance.length,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendanceRate: parseFloat(attendanceRate),
      streak: recentStreak,
      bestStreak,
      monthlyAverage: parseFloat(monthlyAverage),
      coursesCount: Object.keys(coursesAttendance).length
    };
  }, [attendance, coursesAttendance]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused': return <UserCheck className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    const startDay = firstDay.getDay();
    
    for (let i = 0; i < startDay; i++) {
      calendar.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      // Check if student had ANY attendance on this day
      const dayAttendance = attendance.filter(a => 
        a.date && 
        a.date.getDate() === day && 
        a.date.getMonth() === selectedMonth && 
        a.date.getFullYear() === selectedYear
      );
      
      // Determine overall status for the day
      let overallStatus = 'present';
      if (dayAttendance.some(a => a.status === 'absent')) {
        overallStatus = 'absent';
      } else if (dayAttendance.some(a => a.status === 'late')) {
        overallStatus = 'late';
      }
      
      calendar.push({
        day,
        date,
        records: dayAttendance,
        overallStatus: dayAttendance.length > 0 ? overallStatus : null
      });
    }
    
    return calendar;
  }, [attendance, selectedMonth, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const filteredAttendance = attendance.filter(record => {
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (filterCourse !== 'all' && record.courseId !== filterCourse) return false;
    return true;
  });

  const downloadAttendanceReport = () => {
    if (attendance.length === 0) return;
    
    const csvContent = [
      ['Date', 'Course', 'Status', 'Teacher', 'Period', 'Remarks'],
      ...attendance.map(record => [
        record.date.toLocaleDateString(),
        record.courseName,
        record.status.toUpperCase(),
        record.teacherName,
        record.period || 'Regular',
        record.remarks || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${actualStudentId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Loading attendance records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            Track your attendance across all subjects
          </p>
          {attendance.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {attendance.length} attendance record(s) across {stats.coursesCount} subject(s)
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('subjects')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'subjects' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Subject
            </button>
          </div>
          
          <button 
            onClick={downloadAttendanceReport}
            disabled={attendance.length === 0}
            className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {attendance.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stats.attendanceRate}%</div>
                  <div className="text-sm opacity-90 mt-1">Overall Rate</div>
                </div>
                <CalendarDays className="w-10 h-10 opacity-80" />
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-4">
                <div 
                  className="bg-white h-2 rounded-full" 
                  style={{ width: `${stats.attendanceRate}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">{stats.presentDays}</div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Current streak: <span className="font-medium text-emerald-600">{stats.streak} days</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">{stats.absentDays}</div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Across {stats.coursesCount} subject(s)
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-600">{stats.lateDays}</div>
                  <div className="text-sm text-gray-500">Late</div>
                </div>
              </div>
            </div>
          </div>

          {/* View Content */}
          {viewMode === 'calendar' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-lg font-bold text-gray-900">Attendance Calendar</h2>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <div className="text-center min-w-[160px]">
                      <div className="font-semibold text-gray-900">{monthNames[selectedMonth]} {selectedYear}</div>
                    </div>
                    
                    <button 
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedMonth(new Date().getMonth());
                      setSelectedYear(new Date().getFullYear());
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Today
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayData, index) => {
                    if (!dayData) {
                      return <div key={index} className="h-20 bg-gray-50 rounded-lg"></div>;
                    }
                    
                    const isToday = dayData.date.toDateString() === new Date().toDateString();
                    const hasAttendance = dayData.records.length > 0;
                    const status = dayData.overallStatus;
                    
                    let bgColor = 'bg-white';
                    if (isToday) bgColor = 'bg-emerald-50 border-emerald-300';
                    else if (hasAttendance && status === 'present') bgColor = 'bg-emerald-50';
                    else if (hasAttendance && status === 'absent') bgColor = 'bg-red-50';
                    else if (hasAttendance && status === 'late') bgColor = 'bg-yellow-50';
                    else bgColor = 'bg-gray-50';
                    
                    return (
                      <div 
                        key={index}
                        className={`h-20 border rounded-lg p-2 flex flex-col items-center justify-center ${bgColor} ${
                          isToday ? 'border-emerald-500 border-2' : 'border-gray-200'
                        }`}
                      >
                        <div className={`text-sm font-medium ${isToday ? 'text-emerald-600' : 'text-gray-700'}`}>
                          {dayData.day}
                        </div>
                        
                        {hasAttendance && (
                          <div className="mt-1 text-center">
                            {getStatusIcon(status)}
                            {dayData.records.length > 1 && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({dayData.records.length})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-50 border border-emerald-300 rounded"></div>
                  <span className="text-sm text-gray-600">Present (all subjects)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-600">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Absent (missed class)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-emerald-500 rounded"></div>
                  <span className="text-sm text-gray-600">Today</span>
                </div>
              </div>
            </div>
          ) : (
            // Subject-wise Attendance View
            <div className="space-y-6">
              {/* Per Subject Statistics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Attendance by Subject
                </h2>
                
                <div className="space-y-6">
                  {Object.entries(coursesAttendance).map(([courseName, courseStats]) => (
                    <div key={courseName} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{courseName}</h3>
                          <p className="text-sm text-gray-500">{courseStats.total} sessions</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            courseStats.attendanceRate >= 90 ? 'text-emerald-600' :
                            courseStats.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {courseStats.attendanceRate}%
                          </div>
                          <div className="text-xs text-gray-500">Attendance Rate</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full ${
                            courseStats.attendanceRate >= 90 ? 'bg-emerald-500' :
                            courseStats.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${courseStats.attendanceRate}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Present: {courseStats.present}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Absent: {courseStats.absent}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>Late: {courseStats.late}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Attendance Records */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Attendance Records</h3>
                
                {filteredAttendance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No attendance records match your filters
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Subject</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Teacher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredAttendance.slice(0, 10).map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {record.date.toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {record.courseName}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {record.teacherName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Attendance Records</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Attendance records will appear here once your teachers mark your attendance for each subject.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;