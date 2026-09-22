// components/teachers/TeacherStudents.jsx - OPTIMIZED (FIXED LOADING BUG)
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Filter, Mail, Phone, Calendar, Award, 
  TrendingUp, TrendingDown, MoreVertical, Download, Eye,
  UserCheck, UserX, Clock, Loader, Star, BookOpen, GraduationCap
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TeacherStudents = ({ teacherId, teacherCourses, enrolledStudentsByCourse, students }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState({});

  // ✅ Stable key — recompute effect only when actual IDs change, not references
  const courseIdsKey = useMemo(
    () => (teacherCourses || []).map(c => c.id).sort().join('|'),
    [teacherCourses]
  );

  // ✅ Stable key for enrollment data — based on counts, not object identity
  const enrollmentKey = useMemo(() => {
    if (!enrolledStudentsByCourse) return '';
    return Object.entries(enrolledStudentsByCourse)
      .map(([courseId, list]) => `${courseId}:${list?.length || 0}`)
      .sort()
      .join('|');
  }, [enrolledStudentsByCourse]);

  // Load all enrolled students with their details
  useEffect(() => {
    // ✅ Handle missing prerequisites — stop loading gracefully
    if (!teacherId) {
      setLoading(false);
      return;
    }
    if (teacherCourses.length === 0) {
      setLoading(false);
      return;
    }
    if (!enrolledStudentsByCourse || Object.keys(enrolledStudentsByCourse).length === 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    // ✅ Ref is scoped to THIS effect run, not shared across renders
    let isLoading = false;

    const loadStudents = async () => {
      if (isLoading) return;   // local guard — reset every effect run
      isLoading = true;
      setLoading(true);
      const studentMap = new Map();

      try {
        console.log('📚 Loading students for teacher:', teacherId);

        // ─────────────────────────────────────────────
        // STEP 1: Build student map from enrollment data (no queries)
        // ─────────────────────────────────────────────
        for (const [courseId, courseStudents] of Object.entries(enrolledStudentsByCourse)) {
          const course = teacherCourses.find(c => c.id === courseId);
          if (!courseStudents || courseStudents.length === 0) continue;

          for (const enrollment of courseStudents) {
            const studentId = enrollment.studentId;
            if (!studentId) continue;

            if (!studentMap.has(studentId)) {
              studentMap.set(studentId, {
                ...enrollment,
                courses: [],
                enrollmentDate: enrollment.enrolledAt || enrollment.enrollmentDate || new Date(),
                attendanceRate: 0,
                averageGrade: 0,
              });
            }

            if (course) {
              const studentData = studentMap.get(studentId);
              studentData.courses.push({
                courseId: course.id,
                courseName: course.courseName,
                enrollmentStatus: enrollment.status || 'active',
              });
              studentMap.set(studentId, studentData);
            }
          }
        }

        // Fallback — cross-reference the `students` prop
        const studentsById = new Map();
        (students || []).forEach(s => {
          if (s.studentId) studentsById.set(s.studentId, s);
          if (s.id) studentsById.set(s.id, s);
        });

        for (const [studentId, student] of studentMap) {
          if (!student.fullName) {
            const fallback = studentsById.get(studentId);
            if (fallback) {
              studentMap.set(studentId, {
                ...student,
                ...fallback,
                courses: student.courses,
                enrollmentDate: student.enrollmentDate,
              });
            }
          }
        }

        // ─────────────────────────────────────────────
        // STEP 2: Fetch ALL grades for these students in batched queries
        // ─────────────────────────────────────────────
        const studentIdList = Array.from(studentMap.keys());
        const performanceData = {};

        studentIdList.forEach(id => {
          performanceData[id] = { averageGrade: 0, totalAssignments: 0, gradedAssignments: 0 };
        });

        for (let i = 0; i < studentIdList.length; i += 30) {
          if (!isMounted) return;
          const batch = studentIdList.slice(i, i + 30);
          try {
            const gradesQuery = query(
              collection(db, 'grades'),
              where('studentId', 'in', batch)
            );
            const gradesSnapshot = await getDocs(gradesQuery);

            const gradesByStudent = {};
            gradesSnapshot.forEach(doc => {
              const g = doc.data();
              if (!g.studentId) return;
              if (!gradesByStudent[g.studentId]) gradesByStudent[g.studentId] = [];
              gradesByStudent[g.studentId].push(g);
            });

            for (const [studentId, grades] of Object.entries(gradesByStudent)) {
              const avgGrade = grades.reduce(
                (sum, g) => sum + (g.percentage || g.grade || 0), 0
              ) / grades.length;
              performanceData[studentId] = {
                averageGrade: Math.round(avgGrade),
                totalAssignments: grades.length,
                gradedAssignments: grades.filter(g => g.score !== undefined).length,
              };
            }
          } catch (error) {
            console.warn(`Error batch-fetching grades for chunk ${i / 30}:`, error);
          }
        }

        if (!isMounted) return;

        setStudentPerformance(performanceData);
        setAllStudents(Array.from(studentMap.values()));
        console.log(`✅ Loaded ${studentMap.size} students total`);

      } catch (error) {
        console.error('Error loading students:', error);
        if (isMounted) {
          setAllStudents([]);
          setStudentPerformance({});
        }
      } finally {
        // ✅ ALWAYS reset loading, regardless of what happened
        if (isMounted) setLoading(false);
        isLoading = false;
      }
    };

    loadStudents();

    return () => { isMounted = false; };
  }, [teacherId, courseIdsKey, enrollmentKey, students]);

  // ─────────────────────────────────────────────
  // Derived data — memoized
  // ─────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const matches =
          student.fullName?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.studentId?.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (selectedCourse !== 'all') {
        const hasCourse = student.courses?.some(c => c.courseId === selectedCourse);
        if (!hasCourse) return false;
      }

      const performance = studentPerformance[student.id] || studentPerformance[student.studentId];
      if (selectedGrade !== 'all' && performance) {
        const avg = performance.averageGrade || 0;
        if (selectedGrade === 'excellent' && avg < 85) return false;
        if (selectedGrade === 'good' && (avg < 70 || avg >= 85)) return false;
        if (selectedGrade === 'average' && (avg < 60 || avg >= 70)) return false;
        if (selectedGrade === 'needsImprovement' && avg >= 60) return false;
      }

      return true;
    });
  }, [allStudents, searchQuery, selectedCourse, selectedGrade, studentPerformance]);

  const exportToCSV = () => {
    const csvData = filteredStudents.map(student => ({
      'Student ID': student.studentId || student.id,
      'Full Name': student.fullName,
      'Email': student.email,
      'Courses': student.courses?.map(c => c.courseName).join(', '),
      'Average Grade': `${studentPerformance[student.id]?.averageGrade || studentPerformance[student.studentId]?.averageGrade || 0}%`,
      'Status': 'Active',
    }));

    if (csvData.length === 0) return;

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ ZIMSEC O-Level grading scale
  const getLetterGrade = (percentage) => {
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  // ✅ ZIMSEC-aligned performance color
  const getPerformanceColor = (percentage) => {
    if (percentage >= 75) return 'text-emerald-600';
    if (percentage >= 65) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  const totalStudents = allStudents.length;
  const avgPerCourse = Math.round(totalStudents / Math.max(teacherCourses.length, 1));
  const avgGradeOverall = allStudents.length > 0
    ? Math.round(
        allStudents.reduce((sum, s) => {
          const p = studentPerformance[s.id] || studentPerformance[s.studentId];
          return sum + (p?.averageGrade || 0);
        }, 0) / allStudents.length
      )
    : 0;

  if (totalStudents === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">Manage and track student performance across your courses</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Enrolled Yet</h3>
          <p className="text-gray-600">
            You haven't enrolled any students in your courses yet.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Go to "My Courses" → Click on a course → "Enroll Students" to add students.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage and track student performance across your courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export List
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
              <div className="text-sm text-gray-500 mt-1">Total Students</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{avgPerCourse}</div>
              <div className="text-sm text-gray-500 mt-1">Avg per Course</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold ${getPerformanceColor(avgGradeOverall)}`}>
                {avgGradeOverall}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Grade</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{teacherCourses.length}</div>
              <div className="text-sm text-gray-500 mt-1">Active Courses</div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
              >
                <option value="all">All Courses</option>
                {teacherCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.courseName}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
              >
                <option value="all">All Grades</option>
                <option value="excellent">Excellent (75%+)</option>
                <option value="good">Good (65-74%)</option>
                <option value="average">Average (50-64%)</option>
                <option value="needsImprovement">Needs Improvement (&lt;50%)</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">No students match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Courses</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Avg Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const performance =
                    studentPerformance[student.id] ||
                    studentPerformance[student.studentId] ||
                    { averageGrade: 0 };
                  const avgGrade = performance.averageGrade || 0;
                  const key = student.id || student.studentId;

                  return (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.fullName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{student.studentId || key?.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[150px]">{student.email || 'No email'}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(student.courses || []).slice(0, 2).map((course, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded whitespace-nowrap">
                              {course.courseName?.substring(0, 15)}
                            </span>
                          ))}
                          {(student.courses || []).length > 2 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                              +{(student.courses || []).length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getPerformanceColor(avgGrade)}`}>
                            {avgGrade}%
                          </span>
                          {avgGrade >= 75 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          ) : avgGrade < 50 ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`mailto:${student.email}`, '_blank')}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Email Student"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredStudents.length} of {allStudents.length} students
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;