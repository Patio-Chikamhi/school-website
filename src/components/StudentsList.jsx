import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, Edit, Trash2, Eye, 
  UserPlus, ChevronRight, ChevronLeft, Mail, Phone, 
  GraduationCap, Home, Calendar, AlertCircle, CheckCircle,
  XCircle, Loader, RefreshCw, User as UserIcon, MoreVertical, Key
} from 'lucide-react';
import { db, auth } from '../firebase/config';
import { 
  collection, query, getDocs, orderBy, limit, 
  startAfter, doc, deleteDoc, updateDoc, 
  where, getCountFromServer
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import BulkEnrollStudents from './admin/BulkEnrollStudents';

const StudentsList = ({ refreshTrigger, onAddStudent }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [studentCredentials, setStudentCredentials] = useState(null);

  const itemsPerPage = 20;
  const gradeOptions = ['all', 'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', 
    '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', 
    '9th Grade', '10th Grade', '11th Grade', '12th Grade'];

  // Fetch students with pagination
  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger, currentPage, filterGrade, sortBy, sortOrder]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'students'), orderBy(sortBy === 'name' ? 'fullName' : sortBy, sortOrder));
      
      if (filterGrade !== 'all') {
        q = query(q, where('grade', '==', filterGrade));
      }
      
      q = query(q, limit(itemsPerPage));
      if (lastDoc && currentPage > 1) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      const nextQuery = query(q, limit(1));
      const nextSnapshot = await getDocs(nextQuery);
      setHasMore(nextSnapshot.docs.length > 0);
      
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setStudents(studentsData);
      
      const countQuery = filterGrade !== 'all' 
        ? query(collection(db, 'students'), where('grade', '==', filterGrade))
        : query(collection(db, 'students'));
      
      const totalSnapshot = await getCountFromServer(countQuery);
      const totalCount = totalSnapshot.data().count;
      setTotalStudents(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterGrade(e.target.value);
    setCurrentPage(1);
    setLastDoc(null);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
    setLastDoc(null);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'students', selectedStudent.id));
      
      const usersQuery = query(collection(db, 'users'), where('studentId', '==', selectedStudent.studentId));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach(async (userDoc) => {
        await deleteDoc(doc(db, 'users', userDoc.id));
      });
      
      alert('Student deleted successfully');
      fetchStudents();
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`Error deleting student: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEnrollment = async (student) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'students', student.id), {
        isEnrolled: !student.isEnrolled,
        enrollmentStatus: student.isEnrolled ? 'not_enrolled' : 'enrolled',
        updatedAt: new Date()
      });
      
      alert(`Student ${student.isEnrolled ? 'unenrolled' : 'enrolled'} successfully`);
      fetchStudents();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert(`Error updating enrollment: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewCredentials = async (student) => {
    setActionLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('studentId', '==', student.studentId));
      const usersSnapshot = await getDocs(usersQuery);
      
      let email = student.email;
      let userUid = null;
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        email = userData.email;
        userUid = userData.uid;
      }
      
      setStudentCredentials({
        studentId: student.studentId,
        name: student.fullName,
        email: email,
        grade: student.grade,
        class: student.class,
        userUid: userUid
      });
      setShowCredentialsModal(true);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      alert('Could not fetch student credentials');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!studentCredentials?.email) return;
    
    setActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, studentCredentials.email);
      alert(`Password reset email sent to ${studentCredentials.email}\n\nThe student will receive an email with instructions to create a new password.`);
      setShowResetModal(false);
      setShowCredentialsModal(false);
    } catch (error) {
      console.error('Error sending reset email:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setLastDoc(null);
    fetchStudents();
  };

  const exportToCSV = () => {
    const csvData = filteredStudents.map(student => ({
      'Student ID': student.studentId,
      'Full Name': student.fullName,
      'Email': student.email,
      'Grade': student.grade,
      'Class': student.class,
      'Parent Name': student.parentName,
      'Parent Email': student.parentEmail,
      'Status': student.status || 'active',
      'Enrolled': student.isEnrolled ? 'Yes' : 'No'
    }));
    
    const csvContent = [Object.keys(csvData[0] || {}).join(','), 
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

  // Filter students by search query
  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower) ||
      student.grade?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnrollmentColor = (isEnrolled) => {
    return isEnrolled 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
            <p className="text-sm text-gray-500">
              {totalStudents} total students • Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={filteredStudents.length === 0}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowBulkEnroll(true)}
              className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Bulk Enroll
            </button>
            <button
              onClick={onAddStudent}
              className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
            <button
              onClick={handleRefresh}
              className="p-2.5 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, or ID..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterGrade}
              onChange={handleFilterChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Grades</option>
              {gradeOptions.filter(g => g !== 'all').map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setCurrentPage(1);
                setLastDoc(null);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="name-asc">Sort by Name (A-Z)</option>
              <option value="name-desc">Sort by Name (Z-A)</option>
              <option value="grade-asc">Sort by Grade</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStudents.length === 0 && (
        <div className="py-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900">No students found</h4>
          <p className="text-gray-500 mt-2">
            {searchQuery || filterGrade !== 'all' 
              ? 'Try changing your search or filter criteria'
              : 'No students in the system yet'}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => setShowBulkEnroll(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4 inline mr-2" />
              Bulk Enroll
            </button>
            <button
              onClick={onAddStudent}
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Add First Student
            </button>
          </div>
        </div>
      )}

      {/* Students List */}
      {!loading && filteredStudents.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    <button onClick={() => handleSortChange('name')} className="flex items-center gap-1 hover:text-gray-700">
                      Student
                      {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    <button onClick={() => handleSortChange('studentId')} className="flex items-center gap-1 hover:text-gray-700">
                      Student ID
                      {sortBy === 'studentId' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Grade</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Enrollment</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.fullName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{student.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="font-mono text-gray-800">{student.studentId || 'N/A'}</code>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{student.grade || 'Not assigned'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleEnrollment(student)}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getEnrollmentColor(student.isEnrolled)}`}
                      >
                        {student.isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                      </button>
                      {student.enrolledCourses?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {student.enrolledCourses.length} course(s)
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {student.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCredentials(student)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                          title="View Credentials"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `mailto:${student.email}`}
                          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalStudents)} of {totalStudents} students
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || !hasMore}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && studentCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Student Credentials</h3>
                  <p className="text-sm text-gray-500">Login information for {studentCredentials.name}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Student ID</p>
                  <p className="font-mono font-medium">{studentCredentials.studentId}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{studentCredentials.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Grade / Class</p>
                  <p>{studentCredentials.grade} / {studentCredentials.class}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  🔒 Password not stored for security. Click "Reset Password" to send a reset link to the student's email.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setStudentCredentials(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetModal && studentCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reset Password</h3>
                  <p className="text-sm text-gray-500">Send password reset email</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                A password reset link will be sent to:
              </p>
              <p className="font-medium text-blue-600 mb-6">{studentCredentials.email}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ The student will need to check their email and follow the link to create a new password.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Student</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">{selectedStudent.fullName}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Student ID: {selectedStudent.studentId} • Grade: {selectedStudent.grade}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {showBulkEnroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Bulk Student Enrollment</h2>
              <button onClick={() => setShowBulkEnroll(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <BulkEnrollStudents onComplete={() => {
                setShowBulkEnroll(false);
                handleRefresh();
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;