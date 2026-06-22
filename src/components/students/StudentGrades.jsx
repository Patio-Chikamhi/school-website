// components/students/StudentGrades.jsx - FIXED VERSION
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  BookOpen,
  Eye,
  FileText,
  Target,
  Star,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentGrades = ({ studentId }) => {
  // State
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState(['all']);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch grades data
  const fetchGradesData = useCallback(async () => {
    if (!studentId || studentId === 'undefined') {
      setLoading(false);
      setError('No student ID provided');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('📊 Fetching grades for student:', studentId);
      
      // FIX: Try multiple query approaches
      let gradesData = [];
      
      // Approach 1: Direct query with studentId
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', studentId)
      );
      
      const gradesSnapshot = await getDocs(gradesQuery);
      console.log(`📊 Approach 1: Found ${gradesSnapshot.size} grades`);
      
      gradesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Grade found:', data.assignmentName, data.percentage);
        
        // Determine the date field (could be gradedAt, dateRecorded, or createdAt)
        let gradeDate = null;
        if (data.gradedAt?.toDate) gradeDate = data.gradedAt.toDate();
        else if (data.dateRecorded?.toDate) gradeDate = data.dateRecorded.toDate();
        else if (data.createdAt?.toDate) gradeDate = data.createdAt.toDate();
        else gradeDate = new Date();
        
        gradesData.push({
          id: doc.id,
          ...data,
          grade: data.score || data.grade,
          maxScore: data.maxScore || 100,
          percentage: data.percentage || Math.round(((data.score || data.grade || 0) / (data.maxScore || 100)) * 100),
          assignmentName: data.assignmentName || data.title || 'Assignment',
          courseName: data.courseName || 'Course',
          comments: data.comments || '',
          gradedAt: gradeDate,
          teacherName: data.teacherName || data.recordedByName || 'Teacher',
          letterGrade: data.letterGrade || this.getLetterGradeFromPercentage?.(data.percentage) || 'N/A'
        });
      });
      
      // If no grades found, try alternative approach
      if (gradesData.length === 0) {
        console.log('No grades found with direct query, trying alternative approach...');
        
        // Approach 2: Query without orderBy first
        const simpleQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', studentId),
          limit(100)
        );
        
        const simpleSnapshot = await getDocs(simpleQuery);
        console.log(`📊 Approach 2: Found ${simpleSnapshot.size} grades`);
        
        simpleSnapshot.forEach(doc => {
          const data = doc.data();
          let gradeDate = null;
          if (data.gradedAt?.toDate) gradeDate = data.gradedAt.toDate();
          else if (data.dateRecorded?.toDate) gradeDate = data.dateRecorded.toDate();
          else if (data.createdAt?.toDate) gradeDate = data.createdAt.toDate();
          else gradeDate = new Date();
          
          gradesData.push({
            id: doc.id,
            ...data,
            grade: data.score || data.grade,
            maxScore: data.maxScore || 100,
            percentage: data.percentage || Math.round(((data.score || data.grade || 0) / (data.maxScore || 100)) * 100),
            assignmentName: data.assignmentName || data.title || 'Assignment',
            courseName: data.courseName || 'Course',
            comments: data.comments || '',
            gradedAt: gradeDate,
            teacherName: data.teacherName || data.recordedByName || 'Teacher'
          });
        });
      }
      
      // Approach 3: If still no results, try using string conversion for studentId
      if (gradesData.length === 0) {
        console.log('Still no grades, trying string conversion...');
        
        const allGradesQuery = query(
          collection(db, 'grades'),
          limit(200)
        );
        
        const allSnapshot = await getDocs(allGradesQuery);
        
        allSnapshot.forEach(doc => {
          const data = doc.data();
          // Compare as strings to handle type mismatches
          if (String(data.studentId) === String(studentId)) {
            console.log('Found matching grade via string conversion:', data.assignmentName);
            
            let gradeDate = null;
            if (data.gradedAt?.toDate) gradeDate = data.gradedAt.toDate();
            else if (data.dateRecorded?.toDate) gradeDate = data.dateRecorded.toDate();
            else if (data.createdAt?.toDate) gradeDate = data.createdAt.toDate();
            else gradeDate = new Date();
            
            gradesData.push({
              id: doc.id,
              ...data,
              grade: data.score || data.grade,
              maxScore: data.maxScore || 100,
              percentage: data.percentage || Math.round(((data.score || data.grade || 0) / (data.maxScore || 100)) * 100),
              assignmentName: data.assignmentName || data.title || 'Assignment',
              courseName: data.courseName || 'Course',
              comments: data.comments || '',
              gradedAt: gradeDate,
              teacherName: data.teacherName || data.recordedByName || 'Teacher'
            });
          }
        });
      }
      
      // Sort by date (most recent first)
      gradesData.sort((a, b) => b.gradedAt - a.gradedAt);
      
      console.log(`✅ Processed ${gradesData.length} grades total`);
      setGrades(gradesData);
      
      // Extract unique courses
      const uniqueCourses = ['all'];
      const courseSet = new Set();
      gradesData.forEach(grade => {
        if (grade.courseName && grade.courseName !== 'General') {
          courseSet.add(grade.courseName);
        }
      });
      uniqueCourses.push(...Array.from(courseSet));
      setCourses(uniqueCourses);
      setLastFetchTime(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching grades:', error);
      setError(`Failed to load grades: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Initial fetch
  useEffect(() => {
    fetchGradesData();
  }, [fetchGradesData]);

  // Memoized filtered grades
  const filteredGrades = useMemo(() => {
    if (!Array.isArray(grades) || grades.length === 0) return [];
    
    return grades.filter(grade => {
      // Filter by course
      if (selectedCourse !== 'all' && grade.courseName !== selectedCourse) {
        return false;
      }
      
      const percentage = grade.percentage || 0;
      
      // Filter by grade range
      switch (filter) {
        case 'excellent': return percentage >= 90;
        case 'good': return percentage >= 80 && percentage < 90;
        case 'average': return percentage >= 70 && percentage < 80;
        case 'needsImprovement': return percentage < 70;
        default: return true;
      }
    });
  }, [grades, selectedCourse, filter]);

  // Memoized statistics
  const stats = useMemo(() => {
    if (!Array.isArray(grades) || grades.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 100,
        totalAssignments: 0,
        completed: 0,
        passingRate: 0,
        recentGrades: 0,
        gradeTrend: 'stable'
      };
    }

    // Extract valid numeric grades
    const validGrades = grades
      .map(g => g.percentage || 0)
      .filter(g => !isNaN(g) && g > 0);
    
    if (validGrades.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 100,
        totalAssignments: grades.length,
        completed: grades.filter(g => g.gradedAt).length,
        passingRate: 0,
        gradeTrend: 'stable'
      };
    }
    
    // Calculate statistics
    const sum = validGrades.reduce((a, b) => a + b, 0);
    const averageGrade = (sum / validGrades.length).toFixed(1);
    const highestGrade = Math.max(...validGrades);
    const lowestGrade = Math.min(...validGrades);
    const passingCount = validGrades.filter(g => g >= 60).length;
    const passingRate = ((passingCount / validGrades.length) * 100).toFixed(1);
    
    // Calculate trend (last 3 vs previous 3)
    let trend = 'stable';
    if (validGrades.length >= 6) {
      const recent = validGrades.slice(0, 3);
      const previous = validGrades.slice(3, 6);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
      
      if (recentAvg > previousAvg + 2) trend = 'up';
      else if (recentAvg < previousAvg - 2) trend = 'down';
    }
    
    return {
      averageGrade: parseFloat(averageGrade) || 0,
      highestGrade: highestGrade || 0,
      lowestGrade: lowestGrade === 100 ? 0 : lowestGrade,
      totalAssignments: grades.length,
      completed: grades.filter(g => g.gradedAt).length,
      passingRate: parseFloat(passingRate) || 0,
      gradeTrend: trend
    };
  }, [grades]);

  // Helper functions
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTrendInfo = (trend) => {
    switch(trend) {
      case 'up': return { text: 'Improving', color: 'text-emerald-600', icon: TrendingUp };
      case 'down': return { text: 'Declining', color: 'text-red-600', icon: TrendingDown };
      default: return { text: 'Stable', color: 'text-yellow-600', icon: TrendingUp };
    }
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const trendInfo = getTrendInfo(stats.gradeTrend);
  const TrendIcon = trendInfo.icon;

  // Download CSV report
  const downloadGradeReport = () => {
    if (grades.length === 0) {
      alert('No grades available to download');
      return;
    }

    const headers = ['Assignment', 'Course', 'Grade', 'Max Score', 'Percentage', 'Letter Grade', 'Graded On', 'Teacher', 'Comments'];
    
    const rows = grades.map(grade => [
      grade.assignmentName,
      grade.courseName,
      grade.grade,
      grade.maxScore,
      grade.percentage,
      getLetterGrade(grade.percentage),
      grade.gradedAt?.toLocaleDateString() || 'Not graded',
      grade.teacherName,
      `"${grade.comments || 'No comments'}"`
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grade_report_${studentId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">Unable to Load Grades</h3>
              <p className="text-red-700">{error}</p>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={fetchGradesData}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grades & Progress</h1>
          <p className="text-gray-600 mt-1">
            Track your academic performance and progress
          </p>
          {lastFetchTime && grades.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {grades.length} grade(s) • Last updated: {lastFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchGradesData}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Refresh grades"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={downloadGradeReport}
            disabled={grades.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Grades
          </button>
        </div>
      </div>

      {/* Stats Cards - Only show if there are grades */}
      {grades.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">{stats.averageGrade}%</div>
                  <div className="text-sm text-gray-500">Average Grade</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(stats.averageGrade, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
                <span className={trendInfo.color}>{trendInfo.text}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{stats.highestGrade}%</div>
                  <div className="text-sm text-gray-500">Highest Grade</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(stats.highestGrade, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {grades.find(g => g.percentage === stats.highestGrade)?.assignmentName || 'N/A'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-600">{stats.passingRate}%</div>
                  <div className="text-sm text-gray-500">Passing Rate</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(stats.passingRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {grades.filter(g => g.percentage >= 60).length}/{grades.length} assignments
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalAssignments}</div>
                  <div className="text-sm text-gray-500">Total Assignments</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(stats.completed / Math.max(stats.totalAssignments, 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {stats.completed} graded • {stats.totalAssignments - stats.completed} pending
              </p>
            </div>
          </div>

          {/* Grade Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Grade History</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filteredGrades.length} of {grades.length} grades shown
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
                      disabled={courses.length <= 1}
                    >
                      {courses.map(course => (
                        <option key={course} value={course}>
                          {course === 'all' ? 'All Courses' : course}
                        </option>
                      ))}
                    </select>
                    <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[180px]"
                    >
                      <option value="all">All Grades</option>
                      <option value="excellent">Excellent (90-100%)</option>
                      <option value="good">Good (80-89%)</option>
                      <option value="average">Average (70-79%)</option>
                      <option value="needsImprovement">Needs Improvement (&lt;70%)</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Assignment</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Grade</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Feedback</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGrades.map((grade) => {
                      const percentage = grade.percentage || 0;
                      
                      return (
                        <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{grade.assignmentName}</div>
                            <div className="text-sm text-gray-500 mt-1">{grade.assignmentType}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900">{grade.courseName}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getGradeColor(percentage)}`}>
                                {percentage}%
                              </span>
                              <div className="text-sm">
                                <div className="font-medium">{grade.grade}/{grade.maxScore}</div>
                                <div className="text-gray-500">({grade.letterGrade})</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            {grade.comments ? (
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600 line-clamp-2">{grade.comments}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No feedback</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {grade.gradedAt?.toLocaleDateString() || 'Not graded'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Empty State
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Grades Available</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Grades will appear here once your teachers have graded your assignments.
          </p>
          <button
            onClick={fetchGradesData}
            className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;