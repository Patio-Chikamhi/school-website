import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, Calendar, BookOpen } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const TakeAttendanceModal = ({ teacherId, teacherName, courses, onClose }) => {
  const [selectedCourse, setSelectedCourse] = useState(courses?.[0]?.id || '');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get course details when selected
  useEffect(() => {
    if (selectedCourse && courses) {
      const course = courses.find(c => c.id === selectedCourse);
      setCurrentCourse(course);
      fetchEnrolledStudents(selectedCourse);
    }
  }, [selectedCourse, courses]);

  // Fetch enrolled students for the selected course
  const fetchEnrolledStudents = async (courseId) => {
    setLoading(true);
    try {
      // Get enrollments for this course
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(enrollmentsQuery);
      const studentList = [];
      
      // For each enrollment, get student details
      for (const enrollmentDoc of snapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Query students collection
        const studentsQuery = query(
          collection(db, 'students'),
          where('id', '==', enrollment.studentId)
        );
        
        const studentSnapshot = await getDocs(studentsQuery);
        if (!studentSnapshot.empty) {
          const studentData = studentSnapshot.docs[0].data();
          studentList.push({
            id: studentData.id || enrollment.studentId,
            name: studentData.fullName || studentData.name || 'Unknown Student',
            studentId: studentData.studentId || 'N/A',
            grade: studentData.grade || 'N/A',
            section: studentData.section || 'N/A',
            status: 'present' // Default status
          });
        } else {
          // Fallback if student document not found
          studentList.push({
            id: enrollment.studentId,
            name: enrollment.studentName || 'Unknown Student',
            studentId: enrollment.studentId,
            grade: 'N/A',
            section: 'N/A',
            status: 'present'
          });
        }
      }
      
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      // Fallback to sample data if error
      setStudents([
        { id: 1, name: 'Alice Johnson', studentId: 'STU001', grade: '10', section: 'A', status: 'present' },
        { id: 2, name: 'Bob Smith', studentId: 'STU002', grade: '10', section: 'A', status: 'present' },
        { id: 3, name: 'Charlie Brown', studentId: 'STU003', grade: '10', section: 'A', status: 'absent' },
        { id: 4, name: 'Diana Prince', studentId: 'STU004', grade: '10', section: 'A', status: 'late' },
        { id: 5, name: 'Ethan Hunt', studentId: 'STU005', grade: '10', section: 'A', status: 'present' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0 };
    students.forEach(student => {
      counts[student.status]++;
    });
    return counts;
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !currentCourse) {
      alert('Please select a course first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'attendance'), {
        date,
        courseId: selectedCourse,
        courseName: currentCourse.courseName,
        teacherId,
        teacherName,
        students: students.map(s => ({
          studentId: s.id,
          name: s.name,
          studentCode: s.studentId,
          status: s.status
        })),
        summary: getStatusCounts(),
        createdAt: serverTimestamp(),
        attendanceType: 'daily',
        term: currentCourse.term || 'Term 1',
        academicYear: currentCourse.academicYear || '2024-25'
      });
      
      alert('✅ Attendance recorded successfully!');
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      alert('❌ Failed to record attendance: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusButton = ({ studentId, currentStatus, targetStatus, icon: Icon, label, color }) => (
    <button
      type="button"
      onClick={() => handleStatusChange(studentId, targetStatus)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        currentStatus === targetStatus
          ? color
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  );

  const counts = getStatusCounts();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Take Attendance</h2>
              <p className="text-gray-600">Record attendance for your class</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Course Selection and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select a course...</option>
                {courses?.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseName} - {course.grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Course Info */}
          {currentCourse && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800">{currentCourse.courseName}</h3>
                  <p className="text-sm text-blue-600">
                    {currentCourse.grade} • {currentCourse.teacherName || 'Your Class'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">
                    Students: {students.length}
                  </p>
                  <p className="text-xs text-blue-600">
                    {currentCourse.schedule?.days} at {currentCourse.schedule?.time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">Present</p>
              <p className="text-2xl font-bold text-green-600">{counts.present}</p>
              <p className="text-xs text-green-600 mt-1">
                {students.length > 0 ? Math.round((counts.present / students.length) * 100) : 0}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">Absent</p>
              <p className="text-2xl font-bold text-red-600">{counts.absent}</p>
              <p className="text-xs text-red-600 mt-1">
                {students.length > 0 ? Math.round((counts.absent / students.length) * 100) : 0}%
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.late}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {students.length > 0 ? Math.round((counts.late / students.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : !selectedCourse ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Please select a course to take attendance</p>
            </div>
          ) : (
            <>
              {/* Students List */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-700">
                    Students ({students.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    Click status buttons to mark
                  </div>
                </div>
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium block">{student.name}</span>
                        <span className="text-sm text-gray-500">
                          {student.studentId} • Grade {student.grade}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <StatusButton
                        studentId={student.id}
                        currentStatus={student.status}
                        targetStatus="present"
                        icon={CheckCircle}
                        label="Present"
                        color="bg-green-100 text-green-700"
                      />
                      <StatusButton
                        studentId={student.id}
                        currentStatus={student.status}
                        targetStatus="absent"
                        icon={XCircle}
                        label="Absent"
                        color="bg-red-100 text-red-700"
                      />
                      <StatusButton
                        studentId={student.id}
                        currentStatus={student.status}
                        targetStatus="late"
                        icon={Clock}
                        label="Late"
                        color="bg-yellow-100 text-yellow-700"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || students.length === 0}
                  className="flex-1 bg-emerald-500 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Attendance'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeAttendanceModal;