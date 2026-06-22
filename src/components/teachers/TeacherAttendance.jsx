// components/teachers/TeacherAttendance.jsx - WITH DETAILED HISTORY MODAL
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, 
  Search, Filter, Download, ChevronDown, Loader,
  AlertCircle, UserCheck, UserX, UserMinus, RefreshCw,
  Eye, X
} from 'lucide-react';
import { db } from '../../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, 
  updateDoc, doc, serverTimestamp, orderBy, limit, setDoc, getDoc
} from 'firebase/firestore';

const TeacherAttendance = ({ teacherId, teacherCourses, enrolledStudentsByCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load students when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadStudentsForCourse();
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  // Load existing attendance for selected date
  useEffect(() => {
    if (selectedCourse && selectedDate && students.length > 0) {
      fetchAttendanceForDate();
    }
  }, [selectedCourse, selectedDate, students.length]);

  const loadStudentsForCourse = () => {
    setLoading(true);
    try {
      const courseStudents = enrolledStudentsByCourse[selectedCourse] || [];
      console.log(`📚 Loading ${courseStudents.length} students for course:`, selectedCourse);
      
      if (courseStudents.length === 0) {
        setError('No students enrolled in this course yet. Please enroll students first.');
        setStudents([]);
      } else {
        setError('');
        const studentsList = courseStudents.map(student => ({
          ...student,
          status: 'present',
          remarks: '',
          studentName: student.fullName || student.studentName || 'Unknown Student'
        }));
        setStudents(studentsList);
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async () => {
    if (!selectedCourse) return;
    
    try {
      const updatedStudents = [...students];
      let hasExisting = false;
      
      for (let i = 0; i < updatedStudents.length; i++) {
        const student = updatedStudents[i];
        const attendanceId = `${selectedCourse}_${student.studentId}_${selectedDate}`;
        const attendanceRef = doc(db, 'attendance', attendanceId);
        const attendanceDoc = await getDoc(attendanceRef);
        
        if (attendanceDoc.exists()) {
          hasExisting = true;
          const data = attendanceDoc.data();
          updatedStudents[i] = {
            ...student,
            status: data.status,
            remarks: data.remarks || ''
          };
        }
      }
      
      if (hasExisting) {
        setStudents(updatedStudents);
        console.log(`✅ Loaded existing attendance for ${updatedStudents.filter(s => s.status !== 'present').length} students`);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    setError('');
    try {
      const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
      const studentIds = enrolledStudents.map(s => s.studentId);
      
      if (studentIds.length === 0) {
        setAttendanceRecords([]);
        setLoading(false);
        return;
      }
      
      const recordsByDate = new Map();
      
      for (const studentId of studentIds) {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentId),
          where('courseId', '==', selectedCourse),
          orderBy('date', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(attendanceQuery);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const dateKey = data.date;
          
          if (!recordsByDate.has(dateKey)) {
            recordsByDate.set(dateKey, {
              date: data.date,
              students: [],
              summary: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
            });
          }
          
          const record = recordsByDate.get(dateKey);
          record.students.push({
            studentId: data.studentId,
            studentName: data.studentName,
            status: data.status,
            remarks: data.remarks || ''
          });
          record.summary[data.status]++;
          record.summary.total++;
        });
      }
      
      const records = Array.from(recordsByDate.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceRecords(records);
      console.log(`📋 Loaded ${records.length} attendance records`);
      
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setError('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudents(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, status: newStatus }
          : student
      )
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setStudents(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, remarks }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }
    
    if (students.length === 0) {
      alert('No students to mark attendance for');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      const course = teacherCourses.find(c => c.id === selectedCourse);
      let savedCount = 0;
      
      for (const student of students) {
        const attendanceId = `${selectedCourse}_${student.studentId}_${selectedDate}`;
        const attendanceRef = doc(db, 'attendance', attendanceId);
        
        await setDoc(attendanceRef, {
          attendanceId: attendanceId,
          studentId: student.studentId,
          studentName: student.studentName || student.fullName,
          courseId: selectedCourse,
          courseName: course?.courseName || 'Unknown Course',
          date: selectedDate,
          status: student.status,
          remarks: student.remarks || '',
          teacherId: teacherId,
          teacherName: course?.teacherName || 'Teacher',
          recordedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        savedCount++;
      }
      
      alert(`✅ Attendance saved for ${savedCount} student(s)!`);
      
      if (showHistory) {
        await fetchAttendanceHistory();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      setError(`Error saving attendance: ${error.message}`);
      alert(`Error saving attendance: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused': return <UserMinus className="w-5 h-5 text-blue-600" />;
      default: return <UserCheck className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredStudents = students.filter(student => 
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm)
  );

  const summary = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    excused: students.filter(s => s.status === 'excused').length,
    total: students.length
  };

  // Details Modal Component
  const AttendanceDetailsModal = ({ record, onClose }) => {
    const presentStudents = record.students.filter(s => s.status === 'present');
    const absentStudents = record.students.filter(s => s.status === 'absent');
    const lateStudents = record.students.filter(s => s.status === 'late');
    const excusedStudents = record.students.filter(s => s.status === 'excused');

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Attendance Details</h2>
              <p className="text-sm text-gray-500">
                {new Date(record.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{presentStudents.length}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{absentStudents.length}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{lateStudents.length}</div>
                <div className="text-sm text-gray-600">Late</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <UserMinus className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{excusedStudents.length}</div>
                <div className="text-sm text-gray-600">Excused</div>
              </div>
            </div>

            {/* Present Students */}
            {presentStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Present Students ({presentStudents.length})
                </h3>
                <div className="bg-green-50 rounded-lg overflow-hidden border border-green-200">
                  <table className="w-full">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student Name</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student ID</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      {presentStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-green-100/50">
                          <td className="py-2 px-4 text-sm">{student.studentName}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.studentId}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                              Present
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Absent Students */}
            {absentStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Absent Students ({absentStudents.length})
                </h3>
                <div className="bg-red-50 rounded-lg overflow-hidden border border-red-200">
                  <table className="w-full">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student Name</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student ID</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Status</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {absentStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-red-100/50">
                          <td className="py-2 px-4 text-sm">{student.studentName}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.studentId}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-800">
                              Absent
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Late Students */}
            {lateStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Late Students ({lateStudents.length})
                </h3>
                <div className="bg-yellow-50 rounded-lg overflow-hidden border border-yellow-200">
                  <table className="w-full">
                    <thead className="bg-yellow-100">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student Name</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student ID</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Status</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100">
                      {lateStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-yellow-100/50">
                          <td className="py-2 px-4 text-sm">{student.studentName}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.studentId}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                              Late
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Excused Students */}
            {excusedStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <UserMinus className="w-5 h-5" />
                  Excused Students ({excusedStudents.length})
                </h3>
                <div className="bg-blue-50 rounded-lg overflow-hidden border border-blue-200">
                  <table className="w-full">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student Name</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Student ID</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Status</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {excusedStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-blue-100/50">
                          <td className="py-2 px-4 text-sm">{student.studentName}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.studentId}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                              Excused
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600">{student.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (teacherCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Assigned</h3>
        <p className="text-gray-500">
          You haven't been assigned any courses yet. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-600">Mark and track student attendance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && selectedCourse) {
                fetchAttendanceHistory();
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showHistory ? 'Take Attendance' : 'View History'}
          </button>
          {selectedCourse && !showHistory && (
            <button
              onClick={loadStudentsForCourse}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Refresh students"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Course and Date Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a course...</option>
              {teacherCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseName} - Grade {course.grade}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      {!showHistory ? (
        // Take Attendance View (same as before)
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
              <div className="text-sm text-gray-600">Excused</div>
            </div>
          </div>

          {!selectedCourse && (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a course to mark attendance</p>
            </div>
          )}

          {selectedCourse && students.length === 0 && !loading && (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Enrolled</h3>
              <p className="text-gray-500">There are no students enrolled in this course yet.</p>
            </div>
          )}

          {selectedCourse && students.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : selectedCourse && students.length > 0 && filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{searchTerm ? 'No students match your search' : 'No students found'}</p>
            </div>
          ) : selectedCourse && students.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <div key={student.studentId} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {student.studentName?.[0] || student.fullName?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.studentName || student.fullName || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'present')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                          student.status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'absent')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                          student.status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'late')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                          student.status === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'excused')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                          student.status === 'excused'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                        }`}
                      >
                        <UserMinus className="w-4 h-4" />
                        Excused
                      </button>
                    </div>
                  </div>
                  
                  {(student.status === 'absent' || student.status === 'late') && (
                    <div className="mt-3 ml-13">
                      <input
                        type="text"
                        placeholder="Add remarks (e.g., Sick, Family emergency)..."
                        value={student.remarks || ''}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedCourse && students.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Attendance History View with Details Modal
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Attendance History</h3>
            <button
              onClick={fetchAttendanceHistory}
              disabled={!selectedCourse}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Load History
            </button>
          </div>
          
          {!selectedCourse && (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a course to view attendance history</p>
            </div>
          )}
          
          {loading && selectedCourse && (
            <div className="p-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          )}
          
          {!loading && selectedCourse && attendanceRecords.length === 0 && !error && (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found for this course</p>
            </div>
          )}
          
          {!loading && attendanceRecords.length > 0 && (
            <div className="divide-y divide-gray-100">
              {attendanceRecords.map((record, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Total: {record.summary?.total || 0} students
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{record.summary?.present || 0}</div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{record.summary?.absent || 0}</div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{record.summary?.late || 0}</div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{record.summary?.excused || 0}</div>
                        <div className="text-xs text-gray-500">Excused</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                  
                  {/* Attendance Rate Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(record.summary?.present / Math.max(record.summary?.total, 1)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{Math.round((record.summary?.present / Math.max(record.summary?.total, 1)) * 100)}% attendance</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <AttendanceDetailsModal 
          record={selectedRecord} 
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default TeacherAttendance;