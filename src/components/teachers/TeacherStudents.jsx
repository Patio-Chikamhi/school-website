// components/teachers/TeacherStudents.jsx - UPDATED to work with your data
import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Mail, Phone, Calendar, Award, 
  TrendingUp, TrendingDown, MoreVertical, Download, Eye,
  UserCheck, UserX, Clock, Loader, Star, BookOpen, GraduationCap
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TeacherStudents = ({ teacherId, teacherCourses, enrolledStudentsByCourse, students }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState({});

  // Load all enrolled students with their details
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      const studentMap = new Map();
      
      try {
        console.log('📚 Loading students for teacher:', teacherId);
        console.log('Enrolled students by course:', enrolledStudentsByCourse);
        
        // Process each course's enrolled students
        for (const [courseId, courseStudents] of Object.entries(enrolledStudentsByCourse)) {
          const course = teacherCourses.find(c => c.id === courseId);
          
          if (!courseStudents || courseStudents.length === 0) {
            console.log(`No students in course: ${course?.courseName}`);
            continue;
          }
          
          console.log(`Processing ${courseStudents.length} students for course: ${course?.courseName}`);
          
          for (const enrollment of courseStudents) {
            const studentId = enrollment.studentId;
            
            if (!studentMap.has(studentId)) {
              // Fetch full student details
              let studentDetails = null;
              
              // Try to find in students array first
              const existingStudent = students?.find(s => 
                s.id === studentId || s.studentId === studentId || s.uid === studentId
              );
              
              if (existingStudent) {
                studentDetails = existingStudent;
              } else {
                // Fetch from Firestore students collection
                const studentQuery = query(
                  collection(db, 'students'),
                  where('studentId', '==', studentId)
                );
                const studentSnapshot = await getDocs(studentQuery);
                
                if (!studentSnapshot.empty) {
                  const studentDoc = studentSnapshot.docs[0];
                  studentDetails = { id: studentDoc.id, ...studentDoc.data() };
                } else {
                  // Try users collection as fallback
                  const userQuery = query(
                    collection(db, 'users'),
                    where('uid', '==', studentId)
                  );
                  const userSnapshot = await getDocs(userQuery);
                  
                  if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    studentDetails = {
                      id: studentId,
                      fullName: userData.name || userData.fullName,
                      email: userData.email,
                      studentId: userData.studentId || studentId,
                      grade: userData.grade,
                      section: userData.section
                    };
                  }
                }
              }
              
              if (studentDetails) {
                studentMap.set(studentId, {
                  ...studentDetails,
                  courses: [],
                  enrollmentDate: enrollment.enrolledAt || enrollment.enrollmentDate || new Date(),
                  attendanceRate: 0,
                  averageGrade: 0
                });
              }
            }
            
            // Add course to student's course list
            if (studentMap.has(studentId) && course) {
              const studentData = studentMap.get(studentId);
              studentData.courses.push({
                courseId: course.id,
                courseName: course.courseName,
                enrollmentStatus: enrollment.status || 'active'
              });
              studentMap.set(studentId, studentData);
            }
          }
        }
        
        // Fetch grades for each student
        const performanceData = {};
        for (const [studentId, student] of studentMap) {
          try {
            const gradesQuery = query(
              collection(db, 'grades'),
              where('studentId', '==', student.studentId || studentId)
            );
            const gradesSnapshot = await getDocs(gradesQuery);
            const grades = gradesSnapshot.docs.map(doc => doc.data());
            
            if (grades.length > 0) {
              const avgGrade = grades.reduce((sum, g) => sum + (g.percentage || g.grade || 0), 0) / grades.length;
              performanceData[studentId] = {
                averageGrade: Math.round(avgGrade),
                totalAssignments: grades.length,
                gradedAssignments: grades.filter(g => g.score !== undefined).length
              };
            } else {
              performanceData[studentId] = { averageGrade: 0, totalAssignments: 0, gradedAssignments: 0 };
            }
          } catch (error) {
            console.error(`Error fetching grades for student ${studentId}:`, error);
            performanceData[studentId] = { averageGrade: 0, totalAssignments: 0, gradedAssignments: 0 };
          }
        }
        
        setStudentPerformance(performanceData);
        setAllStudents(Array.from(studentMap.values()));
        console.log(`✅ Loaded ${studentMap.size} students total`);
        
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load if we have courses with enrolled students
    if (teacherCourses.length > 0 && Object.keys(enrolledStudentsByCourse).length > 0) {
      loadStudents();
    } else {
      setLoading(false);
      console.log('No courses or enrolled students found');
    }
  }, [enrolledStudentsByCourse, teacherCourses, students, teacherId]);
  
  const filteredStudents = allStudents.filter(student => {
    // Search filter
    if (searchQuery && 
        !student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !student.email?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Course filter
    if (selectedCourse !== 'all') {
      const hasCourse = student.courses?.some(course => course.courseId === selectedCourse);
      if (!hasCourse) return false;
    }
    
    // Grade filter
    const performance = studentPerformance[student.id];
    if (selectedGrade !== 'all' && performance) {
      const avgGrade = performance.averageGrade || 0;
      if (selectedGrade === 'excellent' && avgGrade < 85) return false;
      if (selectedGrade === 'good' && (avgGrade < 70 || avgGrade >= 85)) return false;
      if (selectedGrade === 'average' && (avgGrade < 60 || avgGrade >= 70)) return false;
      if (selectedGrade === 'needsImprovement' && avgGrade >= 60) return false;
    }
    
    return true;
  });

  const exportToCSV = () => {
    const csvData = filteredStudents.map(student => ({
      'Student ID': student.studentId || student.id,
      'Full Name': student.fullName,
      'Email': student.email,
      'Courses': student.courses?.map(c => c.courseName).join(', '),
      'Average Grade': `${studentPerformance[student.id]?.averageGrade || 0}%`,
      'Status': 'Active'
    }));
    
    if (csvData.length === 0) return;
    
    const csvContent = [Object.keys(csvData[0]).join(','), 
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 85) return 'text-emerald-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
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
    ? Math.round(allStudents.reduce((sum, s) => sum + (studentPerformance[s.id]?.averageGrade || 0), 0) / allStudents.length)
    : 0;

  // If no students enrolled yet
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
                <option value="excellent">Excellent (85%+)</option>
                <option value="good">Good (70-84%)</option>
                <option value="average">Average (60-69%)</option>
                <option value="needsImprovement">Needs Improvement (&lt;60%)</option>
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
                  const performance = studentPerformance[student.id] || { averageGrade: 0 };
                  const avgGrade = performance.averageGrade || 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.fullName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{student.studentId || student.id?.substring(0, 8)}</div>
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
                          {avgGrade >= 85 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          ) : avgGrade < 60 ? (
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