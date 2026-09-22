// components/teachers/TeacherCourses.jsx - OPTIMIZED
import React, { useState, useMemo, useRef } from 'react';
import { 
  BookOpen, Users, Calendar, Clock, Home, ChevronDown, 
  Edit, Trash2, Plus, Filter, Search, Download, UserPlus,
  UserX, AlertCircle, Loader, CheckCircle, XCircle,
  Award, TrendingUp, TrendingDown, Eye, BarChart3
} from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TeacherCourses = ({ 
  teacherId, 
  teacherCourses, 
  enrolledStudentsByCourse,
  onRefresh,
  onEnrollStudents
}) => {
  // UI State
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Grade Analytics States
  const [showGradeDistribution, setShowGradeDistribution] = useState(false);
  const [courseGrades, setCourseGrades] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState(null);
  
  // Student Management States
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [allStudentsData, setAllStudentsData] = useState([]);

  // ✅ Ref to prevent double analytics fetches in StrictMode
  const analyticsLoadingRef = useRef(false);

  // ✅ Memoize filtered courses
  const filteredCourses = useMemo(() => {
    return teacherCourses.filter(course => {
      if (searchQuery && 
          !course.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !course.courseId?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      const enrolled = enrolledStudentsByCourse[course.id]?.length || 0;
      const capacity = course.capacity || 45;   // ✅ Changed fallback from 30 to 45
      const percentage = Math.round((enrolled / capacity) * 100);
      
      if (filterStatus === 'full' && percentage < 90) return false;
      if (filterStatus === 'moderate' && (percentage < 50 || percentage >= 90)) return false;
      if (filterStatus === 'available' && percentage >= 50) return false;
      
      return true;
    });
  }, [teacherCourses, enrolledStudentsByCourse, searchQuery, filterStatus]);

  const getCourseStats = (courseId) => {
    const enrolled = enrolledStudentsByCourse[courseId]?.length || 0;
    const course = teacherCourses.find(c => c.id === courseId);
    const capacity = course?.capacity || 45;   // ✅ Changed fallback
    const percentage = Math.round((enrolled / capacity) * 100);
    
    return {
      enrolled,
      capacity,
      percentage,
      status: percentage >= 90 ? 'Full' : percentage >= 50 ? 'Moderate' : 'Available'
    };
  };

  // ✅ Unified Zimbabwe O-Level grading scale (matches TeacherGrades.jsx)
  const getLetterGrade = (percentage) => {
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-emerald-100 text-emerald-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  // ✅ OPTIMIZED: Single batched query instead of per-student queries
  const fetchGradeDistribution = async (course) => {
    if (analyticsLoadingRef.current) return;
    analyticsLoadingRef.current = true;
    setLoadingAnalytics(true);
    setSelectedCourse(course);

    try {
      const studentsList = enrolledStudentsByCourse[course.id] || [];
      
      if (studentsList.length === 0) {
        setCourseGrades({ 'A': [], 'B': [], 'C': [], 'D': [], 'F': [] });
        setAllStudentsData([]);
        setShowGradeDistribution(true);
        return;
      }

      // ✅ ONE query for all grades in this course
      const gradesQuery = query(
        collection(db, 'grades'),
        where('courseId', '==', course.id)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      
      // Group grades by student
      const gradesByStudent = {};
      gradesSnapshot.forEach(doc => {
        const data = doc.data();
        if (!gradesByStudent[data.studentId]) gradesByStudent[data.studentId] = [];
        gradesByStudent[data.studentId].push(data);
      });

      const gradeData = { 'A': [], 'B': [], 'C': [], 'D': [], 'F': [] };
      const studentsWithGrades = [];

      for (const student of studentsList) {
        const studentGrades = gradesByStudent[student.studentId] || [];
        
        let totalPercentage = 0;
        let gradeCount = 0;
        studentGrades.forEach(g => {
          const pct = g.percentage || ((g.score / g.maxScore) * 100);
          totalPercentage += pct;
          gradeCount++;
        });

        const averageGrade = gradeCount > 0 ? totalPercentage / gradeCount : 0;
        const letterGrade = getLetterGrade(averageGrade);

        const studentWithGrade = {
          ...student,
          averageGrade,
          letterGrade
        };
        
        studentsWithGrades.push(studentWithGrade);
        gradeData[letterGrade].push(studentWithGrade);
      }

      setCourseGrades(gradeData);
      setAllStudentsData(studentsWithGrades);
      setShowGradeDistribution(true);
    } catch (error) {
      console.error('Error fetching grade distribution:', error);
      alert('Failed to load grade distribution: ' + error.message);
    } finally {
      setLoadingAnalytics(false);
      analyticsLoadingRef.current = false;
    }
  };

  // ✅ Filter students by grade and show them
  const filterAndShowStudentsByGrade = (grade) => {
    const studentsWithThatGrade = courseGrades[grade] || [];
    
    if (studentsWithThatGrade.length === 0) {
      alert(`No students achieved grade ${grade}`);
      return;
    }
    
    setShowGradeDistribution(false);
    setSelectedGradeFilter(grade);
    setStudents(studentsWithThatGrade);
    setStudentSearchTerm('');
    setShowStudentManagement(true);
    setShowEditModal(true);
  };

  const handleEnrollClick = (course, e) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setShowEnrollModal(true);
    if (onEnrollStudents) {
      onEnrollStudents(course);
    }
  };

  const handleEditClick = (course, e) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setStudents(enrolledStudentsByCourse[course.id] || []);
    setStudentSearchTerm('');
    setShowStudentManagement(false);
    setSelectedGradeFilter(null);
    setShowEditModal(true);
  };

  const handleRemoveStudent = async (student) => {
    setRemovingStudent(true);
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', selectedCourse.id),
        where('studentId', '==', student.studentId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      // ✅ Parallel deletes
      await Promise.all(
        enrollmentsSnapshot.docs.map(d => deleteDoc(doc(db, 'enrollments', d.id)))
      );
      
      const studentQuery = query(
        collection(db, 'students'),
        where('studentId', '==', student.studentId)
      );
      const studentSnapshot = await getDocs(studentQuery);
      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        await updateDoc(doc(db, 'students', studentDoc.id), {
          enrolledCourses: arrayRemove(selectedCourse.id),
          updatedAt: new Date()
        });
      }
      
      setStudents(students.filter(s => s.studentId !== student.studentId));
      setShowRemoveModal(null);
      if (onRefresh) onRefresh();
      alert(`✅ Removed ${student.studentName || student.fullName} from the course`);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Error removing student: ' + error.message);
    } finally {
      setRemovingStudent(false);
    }
  };

  // ✅ Memoize filtered students
  const filteredStudentsForManagement = useMemo(() => {
    return students.filter(student => {
      if (!studentSearchTerm) return true;
      const searchLower = studentSearchTerm.toLowerCase();
      return (
        (student.studentName || student.fullName || '').toLowerCase().includes(searchLower) ||
        (student.studentId || '').toLowerCase().includes(searchLower)
      );
    });
  }, [students, studentSearchTerm]);

  // ============================================
  // GRADE DISTRIBUTION MODAL
  // ============================================
  const GradeDistributionModal = ({ course, grades, onClose, onGradeClick }) => {
    const gradeCounts = {
      'A': grades['A']?.length || 0,
      'B': grades['B']?.length || 0,
      'C': grades['C']?.length || 0,
      'D': grades['D']?.length || 0,
      'F': grades['F']?.length || 0
    };
    const total = Object.values(gradeCounts).reduce((a, b) => a + b, 0);
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Grade Distribution</h2>
              <p className="text-sm text-gray-500">{course?.courseName} - {total} Students</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-8">
              {['A', 'B', 'C', 'D', 'F'].map(grade => {
                const count = gradeCounts[grade];
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const color = getGradeColor(grade);
                
                return (
                  <div 
                    key={grade} 
                    className="cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => onGradeClick(grade)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${color}`}>Grade {grade}</span>
                        <span className="text-sm text-gray-500">{count} students</span>
                      </div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          grade === 'A' ? 'bg-emerald-500' : 
                          grade === 'B' ? 'bg-blue-500' : 
                          grade === 'C' ? 'bg-yellow-500' : 
                          grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                        } transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {total > 0 ? (((gradeCounts['A'] + gradeCounts['B']) / total) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-gray-500">Passing Rate (A/B)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gradeCounts['A']}</div>
                  <div className="text-sm text-gray-500">Top Performers (A)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {gradeCounts['D'] + gradeCounts['F']}
                  </div>
                  <div className="text-sm text-gray-500">Needs Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {total > 0 ? (((gradeCounts['A'] + gradeCounts['B'] + gradeCounts['C']) / total) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-gray-500">Satisfactory Rate</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              💡 Click on any grade bar to see students who achieved that grade
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">Manage and view all your assigned courses</p>
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
                placeholder="Search courses by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
              >
                <option value="all">All Courses</option>
                <option value="full">Full (≥ 90%)</option>
                <option value="moderate">Moderate (50-89%)</option>
                <option value="available">Available (&lt;50%)</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Found</h3>
            <p className="text-gray-600">No courses match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const stats = getCourseStats(course.id);
              const isExpanded = expandedCourse === course.id;
              
              return (
                <div key={course.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer p-6"
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          stats.percentage >= 90 ? 'bg-red-100' :
                          stats.percentage >= 50 ? 'bg-yellow-100' :
                          'bg-emerald-100'
                        }`}>
                          <BookOpen className={`w-6 h-6 ${
                            stats.percentage >= 90 ? 'text-red-600' :
                            stats.percentage >= 50 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{course.courseName}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {course.courseId}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {stats.enrolled}/{stats.capacity} students
                            </span>
                            <span>•</span>
                            <span>{course.grade}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              stats.percentage >= 90 ? 'bg-red-100 text-red-700' :
                              stats.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {stats.status}
                            </span>
                          </div>
                          
                          {course.schedule && (
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {Array.isArray(course.schedule.days) 
                                  ? course.schedule.days.join(', ') 
                                  : course.schedule.days}
                              </span>
                              {course.schedule.time && (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {course.schedule.time}
                                </span>
                              )}
                              {course.schedule.room && (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  <Home className="w-4 h-4" />
                                  {course.schedule.room}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{stats.percentage}%</div>
                          <div className="text-sm text-gray-500">filled</div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            stats.percentage >= 90 ? 'bg-red-500' :
                            stats.percentage >= 50 ? 'bg-yellow-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Course Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Course Code:</span>
                              <span className="font-medium">{course.courseId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Credits:</span>
                              <span className="font-medium">{course.credits || '3'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Term:</span>
                              <span className="font-medium">{course.term || 'Fall 2024'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                          <div className="space-y-2">
                            <button 
                              onClick={(e) => handleEnrollClick(course, e)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <UserPlus className="w-4 h-4" />
                              Enroll Students
                            </button>
                            <button 
                              onClick={(e) => handleEditClick(course, e)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Course
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Performance</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg. Grade:</span>
                              <span className="font-medium text-emerald-600">84.5%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Assignments:</span>
                              <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Attendance Rate:</span>
                              <span className="font-medium">94.2%</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => fetchGradeDistribution(course)}
                            disabled={loadingAnalytics}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                          >
                            {loadingAnalytics ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <BarChart3 className="w-4 h-4" />
                            )}
                            View Grade Distribution
                          </button>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Passing Rate:</span>
                              <span className="font-medium text-emerald-600">78%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Top Grade:</span>
                              <span className="font-medium text-emerald-600">A (98%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Needs Help:</span>
                              <span className="font-medium text-red-600">3 students</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Enroll Students</h3>
              <p className="text-gray-600 mb-4">
                Enroll students in <strong>{selectedCourse.courseName}</strong>
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowEnrollModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { 
                    setShowEnrollModal(false); 
                    if (onEnrollStudents) onEnrollStudents(selectedCourse); 
                    else alert(`Opening enrollment for ${selectedCourse.courseName}`); 
                  }} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Continue to Enrollment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Course: {selectedCourse.courseName}</h2>
                <p className="text-sm text-gray-500">Manage course details and enrolled students</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-6">
              <button 
                onClick={() => setShowStudentManagement(false)} 
                className={`py-3 px-4 text-sm font-medium transition-colors ${
                  !showStudentManagement 
                    ? 'border-b-2 border-emerald-500 text-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Course Details
              </button>
              <button 
                onClick={() => { 
                  setShowStudentManagement(true); 
                  setStudents(enrolledStudentsByCourse[selectedCourse.id] || []); 
                }} 
                className={`py-3 px-4 text-sm font-medium transition-colors ${
                  showStudentManagement 
                    ? 'border-b-2 border-emerald-500 text-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Manage Students ({students.length})
              </button>
            </div>

            <div className="p-6">
              {!showStudentManagement && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input 
                        type="text" 
                        defaultValue={selectedCourse.courseName} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                        disabled 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
                      <input 
                        type="text" 
                        defaultValue={selectedCourse.courseId} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                        disabled 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      defaultValue={selectedCourse.description || ''} 
                      rows="3" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      placeholder="Course description..." 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                      <input 
                        type="text" 
                        defaultValue={selectedCourse.grade} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                        disabled 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input 
                        type="number" 
                        defaultValue={selectedCourse.capacity || 45} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                      <input 
                        type="number" 
                        defaultValue={selectedCourse.credits || 3} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button 
                      onClick={() => setShowEditModal(false)} 
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {showStudentManagement && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Enrolled Students 
                      {selectedGradeFilter && (
                        <span className="ml-2 text-sm text-blue-600">
                          ({selectedGradeFilter} students)
                        </span>
                      )}
                    </h3>
                    {selectedGradeFilter && (
                      <button 
                        onClick={() => { 
                          setSelectedGradeFilter(null); 
                          setStudents(enrolledStudentsByCourse[selectedCourse.id] || []); 
                        }} 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Show All
                      </button>
                    )}
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={studentSearchTerm} 
                      onChange={(e) => setStudentSearchTerm(e.target.value)} 
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No students enrolled in this course</p>
                    </div>
                  ) : filteredStudentsForManagement.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No students match your search</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredStudentsForManagement.map((student) => (
                        <div 
                          key={student.studentId} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {(student.studentName || student.fullName)?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.studentName || student.fullName}
                              </div>
                              <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                            </div>
                          </div>
                          {student.letterGrade && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(student.letterGrade)}`}>
                              Grade {student.letterGrade}
                            </span>
                          )}
                          <button 
                            onClick={() => setShowRemoveModal(student)} 
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg" 
                            title="Remove student"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing {filteredStudentsForManagement.length} of {students.length} students
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Remove Student</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Are you sure you want to remove{' '}
                <span className="font-semibold">
                  {showRemoveModal.studentName || showRemoveModal.fullName}
                </span>{' '}
                from <span className="font-semibold">{selectedCourse?.courseName}</span>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800 font-medium">⚠️ This will:</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                  <li>Remove all grades for this student</li>
                  <li>Remove attendance records</li>
                  <li>Student can be re-enrolled if needed</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRemoveModal(null)} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleRemoveStudent(showRemoveModal)} 
                  disabled={removingStudent} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {removingStudent ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Remove Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Distribution Modal */}
      {showGradeDistribution && selectedCourse && (
        <GradeDistributionModal 
          course={selectedCourse}
          grades={courseGrades}
          onClose={() => setShowGradeDistribution(false)}
          onGradeClick={filterAndShowStudentsByGrade}
        />
      )}
    </div>
  );
};

export default TeacherCourses;