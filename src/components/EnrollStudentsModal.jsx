// EnrollStudentsModal.jsx - FIXED VERSION (students will show)
import React, { useState, useEffect } from 'react';
import { 
  X, Search, UserCheck, AlertCircle, Loader, Check, 
  ChevronRight, BookOpen, Users
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, arrayUnion, serverTimestamp
} from 'firebase/firestore';

const EnrollStudentsModal = ({ teacherId, teacherName, courses, students, enrolledStudents, onClose }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  
  // Load available students when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setAvailableStudents([]);
      return;
    }
    
    loadAvailableStudents();
  }, [selectedCourse, students, enrolledStudents]);
  
  const loadAvailableStudents = async () => {
    setLoading(true);
    try {
      console.log('📚 Loading students for course:', selectedCourse);
      console.log('Total students in system:', students?.length);
      
      // Get already enrolled student IDs for this course
      const enrolledInCourse = enrolledStudents[selectedCourse] || [];
      const enrolledStudentIds = enrolledInCourse.map(enrollment => enrollment.studentId);
      
      console.log('Already enrolled student IDs:', enrolledStudentIds);
      
      // FIXED: Show ALL students, not filtering by enrollment status
      // Just filter out students already enrolled in THIS course
      let filteredStudents = [];
      
      if (students && students.length > 0) {
        filteredStudents = students.filter(student => {
          if (!student || !student.studentId) return false;
          
          // Only filter out students already enrolled in THIS course
          // Don't filter by enrollmentStatus or isEnrolled
          const alreadyInCourse = enrolledStudentIds.includes(student.studentId);
          return !alreadyInCourse;
        });
      } else {
        // Fallback: Fetch students directly from Firestore
        console.log('No students in props, fetching directly from Firestore...');
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        filteredStudents = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out already enrolled
        filteredStudents = filteredStudents.filter(student => 
          !enrolledStudentIds.includes(student.studentId)
        );
      }
      
      console.log('Available students after filtering:', filteredStudents.length);
      
      // Create unique list by studentId
      const uniqueStudents = [];
      const seenIds = new Set();
      
      filteredStudents.forEach(student => {
        if (student && student.studentId && !seenIds.has(student.studentId)) {
          seenIds.add(student.studentId);
          uniqueStudents.push(student);
        }
      });
      
      setAvailableStudents(uniqueStudents);
      
    } catch (err) {
      console.error('Error loading students:', err);
      setAvailableStudents([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEnrollStudents = async () => {
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }
    
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student');
      return;
    }
    
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    if (!selectedCourseData) {
      setError('Course not found');
      return;
    }
    
    // Check capacity
    const currentEnrollments = enrolledStudents[selectedCourse]?.length || 0;
    const availableSlots = (selectedCourseData.capacity || 30) - currentEnrollments;
    
    if (selectedStudentIds.length > availableSlots) {
      setError(`Only ${availableSlots} slots available in this course`);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const selectedStudentsData = availableStudents.filter(student => 
        student && selectedStudentIds.includes(student.studentId)
      );
      
      for (const student of selectedStudentsData) {
        // Create enrollment document
        const enrollmentData = {
          studentId: student.studentId,
          studentName: student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
          courseId: selectedCourse,
          courseName: selectedCourseData.courseName,
          teacherId: teacherId,
          teacherName: teacherName,
          enrollmentDate: new Date(),
          status: 'active',
          grade: '',
          attendance: [],
          assignments: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add enrollment document
        await addDoc(collection(db, 'enrollments'), enrollmentData);
        
        // Update student document with enrollment info
        await updateStudentEnrollment(student, enrollmentData);
        
        // Update course document with enrolled student
        await updateCourseEnrollment(student.studentId, selectedCourse);
      }
      
      setSuccess(`Successfully enrolled ${selectedStudentIds.length} student(s) to ${selectedCourseData.courseName}`);
      setSelectedStudentIds([]);
      
      // Refresh available students list
      await loadAvailableStudents();
      
    } catch (err) {
      console.error('Error enrolling students:', err);
      setError(`Error enrolling students: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const updateStudentEnrollment = async (student, enrollmentData) => {
    try {
      // Try to find student by studentId
      const studentQuery = query(
        collection(db, 'students'),
        where('studentId', '==', student.studentId)
      );
      
      const studentSnapshot = await getDocs(studentQuery);
      
      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        const studentDocRef = doc(db, 'students', studentDoc.id);
        const studentData = studentDoc.data();
        
        const enrolledCourses = studentData.enrolledCourses || [];
        
        // Check if already enrolled in this course
        const alreadyEnrolled = enrolledCourses.some(c => c.courseId === enrollmentData.courseId);
        
        if (!alreadyEnrolled) {
          await updateDoc(studentDocRef, {
            enrolledCourses: arrayUnion({
              courseId: enrollmentData.courseId,
              courseName: enrollmentData.courseName,
              enrollmentDate: new Date(),
              teacherId: enrollmentData.teacherId,
              teacherName: enrollmentData.teacherName,
              status: 'active',
              grade: ''
            }),
            enrollmentStatus: 'enrolled',
            isEnrolled: true,
            updatedAt: new Date()
          });
        }
      } else {
        console.log('Student document not found for:', student.studentId);
        // Create new student document if it doesn't exist
        await addDoc(collection(db, 'students'), {
          studentId: student.studentId,
          fullName: student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
          email: student.email || '',
          grade: student.grade || '',
          section: student.section || '',
          enrolledCourses: [{
            courseId: enrollmentData.courseId,
            courseName: enrollmentData.courseName,
            enrollmentDate: new Date(),
            teacherId: enrollmentData.teacherId,
            teacherName: enrollmentData.teacherName,
            status: 'active',
            grade: ''
          }],
          enrollmentStatus: 'enrolled',
          isEnrolled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('Error updating student enrollment:', err);
    }
  };
  
  const updateCourseEnrollment = async (studentId, courseId) => {
    try {
      const courseQuery = query(
        collection(db, 'courses'),
        where('id', '==', courseId)
      );
      
      const courseSnapshot = await getDocs(courseQuery);
      
      if (!courseSnapshot.empty) {
        const courseDoc = courseSnapshot.docs[0];
        const courseDocRef = doc(db, 'courses', courseDoc.id);
        const courseData = courseDoc.data();
        
        const currentEnrolled = courseData.enrolledStudents || [];
        
        if (!currentEnrolled.includes(studentId)) {
          await updateDoc(courseDocRef, {
            enrolledStudents: [...currentEnrolled, studentId],
            updatedAt: new Date()
          });
        }
      }
    } catch (err) {
      console.error('Error updating course enrollment:', err);
    }
  };
  
  const filteredStudents = availableStudents.filter(student => {
    if (!student) return false;
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const fullName = student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const studentId = student.studentId || '';
    const grade = student.grade || '';
    
    return (
      fullName.toLowerCase().includes(searchLower) ||
      studentId.toLowerCase().includes(searchLower) ||
      grade.toLowerCase().includes(searchLower)
    );
  });
  
  const toggleStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents
        .filter(student => student && student.studentId)
        .map(student => student.studentId));
    }
  };

  const getStudentDisplayName = (student) => {
    if (!student) return 'Unknown Student';
    return student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enroll Students</h2>
            <p className="text-sm text-gray-500">Add students to your course</p>
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
                Select Course *
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedStudentIds([]);
                  setError('');
                  setSuccess('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseName} - Grade {course.grade} ({course.courseId})
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
                        Grade {courses.find(c => c.id === selectedCourse)?.grade} • 
                        Capacity: {courses.find(c => c.id === selectedCourse)?.capacity || 30} students •
                        Enrolled: {enrolledStudents[selectedCourse]?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Teacher</div>
                      <div className="font-medium">{teacherName}</div>
                    </div>
                  </div>
                </div>

                {/* Search and Select All */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                  <button
                    onClick={handleSelectAll}
                    disabled={filteredStudents.length === 0 || loading}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </button>
                </div>

                {/* Students List */}
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="py-12 text-center">
                      <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                      <p className="mt-2 text-gray-600">Loading students...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery 
                          ? 'No students match your search'
                          : 'No students available to enroll'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Tip: Make sure there are students in the system and they are not already enrolled in this course.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredStudents.map((student, index) => {
                        if (!student || !student.studentId) return null;
                        
                        const isSelected = selectedStudentIds.includes(student.studentId);
                        const displayName = getStudentDisplayName(student);
                        
                        return (
                          <div 
                            key={`${student.studentId}-${index}`}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleStudent(student.studentId)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-emerald-600 font-medium">
                                    {displayName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {displayName}
                                  </h4>
                                  <div className="text-sm text-gray-500">
                                    {student.studentId} • Grade {student.grade || 'N/A'} • {student.section || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Students Count */}
                {selectedStudentIds.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-emerald-800">
                          {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedStudentIds([])}
                        className="text-sm text-emerald-600 hover:text-emerald-800"
                        disabled={loading}
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                )}

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
                    onClick={handleEnrollStudents}
                    disabled={loading || selectedStudentIds.length === 0}
                    className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Enroll Selected Students ({selectedStudentIds.length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {!selectedCourse && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a Course</h3>
                <p className="text-gray-500 mt-2">Choose a course to see available students</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentsModal;