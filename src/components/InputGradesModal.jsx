// InputGradesModal.jsx - SIMPLIFIED FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  X, Award, AlertCircle, Loader, Check, 
  BookOpen, Users, ChevronDown
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, serverTimestamp, orderBy
} from 'firebase/firestore';

const InputGradesModal = ({ teacherId, teacherName, courses, enrolledStudents, onClose }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courseStudents, setCourseStudents] = useState([]);
  const [grades, setGrades] = useState({});
  
  // Load students when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadStudentsForCourse(selectedCourse);
    }
  }, [selectedCourse]);
  
  const loadStudentsForCourse = async (courseId) => {
    setLoading(true);
    try {
      // Get enrollments for this course
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(enrollmentsQuery);
      const studentsList = [];
      const initialGrades = {};
      
      for (const enrollmentDoc of snapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Get student details
        const studentQuery = query(
          collection(db, 'students'),
          where('studentId', '==', enrollment.studentId)
        );
        
        const studentSnapshot = await getDocs(studentQuery);
        let studentName = enrollment.studentName || 'Unknown Student';
        
        if (!studentSnapshot.empty) {
          const studentData = studentSnapshot.docs[0].data();
          studentName = studentData.fullName || studentData.name || studentName;
        }
        
        const student = {
          id: enrollment.studentId,
          enrollmentId: enrollmentDoc.id,
          name: studentName,
          studentId: enrollment.studentId
        };
        
        studentsList.push(student);
        initialGrades[enrollment.studentId] = '';
      }
      
      setCourseStudents(studentsList);
      setGrades(initialGrades);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitGrades = async () => {
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }
    
    // Validate grades
    const gradesToSubmit = [];
    for (const [studentId, grade] of Object.entries(grades)) {
      if (grade && grade.trim() !== '') {
        const numGrade = parseFloat(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
          setError(`Invalid grade for student ${studentId}. Must be 0-100`);
          return;
        }
        gradesToSubmit.push({ studentId, grade: numGrade });
      }
    }
    
    if (gradesToSubmit.length === 0) {
      setError('Please enter at least one grade');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const course = courses.find(c => c.id === selectedCourse);
      if (!course) {
        throw new Error('Course not found');
      }
      
      // Submit each grade
      for (const { studentId, grade } of gradesToSubmit) {
        const gradeData = {
          studentId: studentId,
          studentName: courseStudents.find(s => s.studentId === studentId)?.name || 'Unknown',
          courseId: selectedCourse,
          courseName: course.courseName,
          teacherId: teacherId,
          teacherName: teacherName,
          grade: grade,
          percentage: grade, // Same as grade for percentage
          type: 'manual',
          description: `Grade entered by ${teacherName}`,
          gradedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          term: 'Term 1',
          academicYear: '2024-2025'
        };
        
        // Add to grades collection
        await addDoc(collection(db, 'grades'), gradeData);
        
        // Update enrollment with grade
        await updateEnrollmentGrade(studentId, selectedCourse, grade);
        
        // Update student document
        await updateStudentGrade(studentId, selectedCourse, grade);
      }
      
      setSuccess(`Successfully submitted ${gradesToSubmit.length} grade(s)`);
      
    } catch (err) {
      console.error('Error submitting grades:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const updateEnrollmentGrade = async (studentId, courseId, grade) => {
    try {
      // Find enrollment
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      if (!enrollmentSnapshot.empty) {
        const enrollmentRef = doc(db, 'enrollments', enrollmentSnapshot.docs[0].id);
        await updateDoc(enrollmentRef, {
          grade: grade,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error updating enrollment:', err);
    }
  };
  
  const updateStudentGrade = async (studentId, courseId, grade) => {
    try {
      // Find student
      const studentQuery = query(
        collection(db, 'students'),
        where('studentId', '==', studentId)
      );
      
      const studentSnapshot = await getDocs(studentQuery);
      if (!studentSnapshot.empty) {
        const studentRef = doc(db, 'students', studentSnapshot.docs[0].id);
        const studentData = studentSnapshot.docs[0].data();
        
        // Update enrolledCourses array
        const enrolledCourses = studentData.enrolledCourses || [];
        const updatedCourses = enrolledCourses.map(course => {
          if (course.courseId === courseId) {
            return { ...course, grade: grade };
          }
          return course;
        });
        
        await updateDoc(studentRef, {
          enrolledCourses: updatedCourses,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error updating student:', err);
    }
  };
  
  const handleGradeChange = (studentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };
  
  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return 'text-emerald-600';
    if (numGrade >= 80) return 'text-blue-600';
    if (numGrade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Input Grades</h2>
            <p className="text-sm text-gray-500">Enter grades for students</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseName} - Grade {course.grade}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <>
                {/* Course Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {courses.find(c => c.id === selectedCourse)?.courseName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {courses.find(c => c.id === selectedCourse)?.grade} • 
                        Students: {courseStudents.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Teacher</div>
                      <div className="font-medium">{teacherName}</div>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loading && courseStudents.length === 0 ? (
                  <div className="py-8 text-center">
                    <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-600">Loading students...</p>
                  </div>
                ) : courseStudents.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No students found in this course</p>
                  </div>
                ) : (
                  <>
                    {/* Grades Input */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Enter Grades (0-100)</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {courseStudents.map((student) => (
                          <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-emerald-600 font-medium">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.studentId}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={grades[student.studentId] || ''}
                                onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                                className={`w-20 px-3 py-2 border rounded-lg text-right font-medium ${getGradeColor(grades[student.studentId])}`}
                                placeholder="0-100"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Error & Success Messages */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertCircle className="w-5 h-5" />
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <Check className="w-5 h-5" />
                          <span>{success}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSubmitGrades}
                        disabled={loading}
                        className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Award className="w-5 h-5" />
                            Submit Grades
                          </>
                        )}
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {!selectedCourse && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a Course</h3>
                <p className="text-gray-500 mt-2">Choose a course to enter grades</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputGradesModal;