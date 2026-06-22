// src/components/admin/EnrollmentManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserMinus, UserCheck, UserX, 
  Search, Filter, Download, Calendar, Clock,
  AlertCircle, CheckCircle, XCircle, Loader,
  RefreshCw, Eye, Edit, Trash2, MoreVertical,
  GraduationCap, BookOpen, DollarSign, CreditCard,
  TrendingUp, TrendingDown, BarChart3, PieChart,
  FileText, Mail, Phone, Home, Award, Shield,
  ChevronRight, ChevronLeft, Plus, Minus, X
} from 'lucide-react';
import { db, auth } from '../../firebase/config';
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, addDoc, serverTimestamp, orderBy,
  limit, startAfter, getCountFromServer, writeBatch,
  deleteDoc, setDoc
} from 'firebase/firestore';

const EnrollmentManagement = ({ currentUser }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEnrollment, setFilterEnrollment] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removedStudents, setRemovedStudents] = useState([]);
  const [showRemovedStudents, setShowRemovedStudents] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [totalRemoved, setTotalRemoved] = useState(0);
  const [financeData, setFinanceData] = useState({
    totalFees: 0,
    totalPaid: 0,
    outstanding: 0
  });

  // Fetch students with filters
  useEffect(() => {
    fetchStudents();
    fetchRemovedStudents();
    fetchAuditLogs();
  }, [filterStatus, filterEnrollment]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'students'), orderBy('fullName'));
      
      if (filterStatus !== 'all') {
        q = query(q, where('status', '==', filterStatus));
      }
      
      if (filterEnrollment === 'enrolled') {
        q = query(q, where('isEnrolled', '==', true));
      } else if (filterEnrollment === 'not_enrolled') {
        q = query(q, where('isEnrolled', '==', false));
      }
      
      const snapshot = await getDocs(q);
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      
      setStudents(studentsData);
      setTotalStudents(studentsData.length);
      setTotalEnrolled(studentsData.filter(s => s.isEnrolled).length);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemovedStudents = async () => {
    try {
      const removedQuery = query(
        collection(db, 'removedStudents'),
        orderBy('removedAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(removedQuery);
      const removedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        removedAt: doc.data().removedAt?.toDate?.() || new Date()
      }));
      setRemovedStudents(removedData);
      setTotalRemoved(removedData.length);
    } catch (error) {
      console.error('Error fetching removed students:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const auditQuery = query(
        collection(db, 'auditLogs'),
        where('action', 'in', ['enrollment_change', 'student_transfer', 'fee_update']),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(auditQuery);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleTransferStudent = async (student, reason) => {
    setActionLoading(true);
    try {
      const studentRef = doc(db, 'students', student.id);
      
      // Update student status
      await updateDoc(studentRef, {
        status: 'transferred_out',
        isEnrolled: false,
        transferReason: reason,
        transferDate: new Date(),
        transferredOutAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add to removed students with reason
      await addDoc(collection(db, 'removedStudents'), {
        studentId: student.studentId,
        studentName: student.fullName,
        studentData: student,
        removedBy: currentUser?.uid,
        removedByName: currentUser?.name || 'Admin',
        removedByEmail: currentUser?.email,
        reason: reason,
        reasonType: 'transfer_out',
        removedAt: serverTimestamp()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'student_transfer',
        studentId: student.studentId,
        studentName: student.fullName,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Admin',
        details: `Student transferred out: ${reason}`,
        timestamp: serverTimestamp()
      });

      alert(`✅ Student ${student.fullName} has been transferred out successfully.`);
      fetchStudents();
      fetchRemovedStudents();
      setShowTransferModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error transferring student:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${student.fullName}? This action cannot be undone.`)) return;

    setActionLoading(true);
    try {
      // Save to removed students first
      await addDoc(collection(db, 'removedStudents'), {
        studentId: student.studentId,
        studentName: student.fullName,
        studentData: student,
        removedBy: currentUser?.uid,
        removedByName: currentUser?.name || 'Admin',
        removedByEmail: currentUser?.email,
        reason: 'permanently_deleted',
        reasonType: 'deleted',
        removedAt: serverTimestamp()
      });

      // Delete from students collection
      await deleteDoc(doc(db, 'students', student.id));
      
      // Delete from users if exists
      const usersQuery = query(collection(db, 'users'), where('studentId', '==', student.studentId));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach(async (userDoc) => {
        await deleteDoc(doc(db, 'users', userDoc.id));
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'student_deleted',
        studentId: student.studentId,
        studentName: student.fullName,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Admin',
        details: `Student permanently deleted`,
        timestamp: serverTimestamp()
      });

      alert(`✅ Student ${student.fullName} has been permanently deleted.`);
      fetchStudents();
      fetchRemovedStudents();
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreStudent = async (removedStudent) => {
    if (!window.confirm(`Restore ${removedStudent.studentName}?`)) return;

    setActionLoading(true);
    try {
      const studentData = removedStudent.studentData;
      
      // Restore student
      const studentRef = doc(db, 'students', studentData.studentId);
      await setDoc(studentRef, {
        ...studentData,
        status: 'active',
        isEnrolled: true,
        restoredAt: serverTimestamp(),
        restoredBy: currentUser?.uid,
        restoredByName: currentUser?.name || 'Admin',
        updatedAt: serverTimestamp()
      });

      // Remove from removed students
      await deleteDoc(doc(db, 'removedStudents', removedStudent.id));

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'student_restored',
        studentId: removedStudent.studentId,
        studentName: removedStudent.studentName,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Admin',
        details: `Student restored from removed list`,
        timestamp: serverTimestamp()
      });

      alert(`✅ Student ${removedStudent.studentName} has been restored.`);
      fetchStudents();
      fetchRemovedStudents();
    } catch (error) {
      console.error('Error restoring student:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      student.fullName?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  // Fee Management
  const handleUpdateFees = async (studentId, feeData) => {
    setActionLoading(true);
    try {
      const feeRef = doc(db, 'fees', studentId);
      await setDoc(feeRef, {
        ...feeData,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid,
        updatedByName: currentUser?.name || 'Admin'
      }, { merge: true });

      // Update student's fee status
      await updateDoc(doc(db, 'students', studentId), {
        feeStatus: feeData.status || 'pending',
        updatedAt: serverTimestamp()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'fee_update',
        studentId: studentId,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Admin',
        details: `Fee updated: Amount ${feeData.amount}, Status ${feeData.status}`,
        timestamp: serverTimestamp()
      });

      alert('✅ Fee information updated successfully!');
      fetchStudents();
    } catch (error) {
      console.error('Error updating fees:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Finance Stats View
  const FinanceView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">${financeData.totalFees.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600">${financeData.totalPaid.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">${financeData.outstanding.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {financeData.totalFees > 0 
                  ? Math.round((financeData.totalPaid / financeData.totalFees) * 100)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Fee Collection Details</h3>
        <div className="space-y-4">
          {students.filter(s => s.isEnrolled).slice(0, 10).map(student => (
            <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{student.fullName}</p>
                <p className="text-sm text-gray-500">{student.studentId}</p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">$500</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="font-medium text-emerald-600">$300</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-medium text-red-600">$200</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Partial
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Removed Students View
  const RemovedStudentsView = () => (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Removed Students</h3>
            <p className="text-sm text-gray-500">{removedStudents.length} students removed</p>
          </div>
          <button
            onClick={() => setShowRemovedStudents(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Students
          </button>
        </div>
      </div>
      
      {removedStudents.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No removed students</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {removedStudents.map((student) => (
            <div key={student.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                    {student.studentName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.studentName}</div>
                    <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                    <div className="text-xs text-red-600">
                      Removed: {student.removedAt?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.reasonType === 'transfer_out' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.reasonType === 'transfer_out' ? 'Transferred Out' : 'Deleted'}
                  </span>
                  <span className="text-sm text-gray-500">
                    By: {student.removedByName}
                  </span>
                  <button
                    onClick={() => handleRestoreStudent(student)}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                  >
                    Restore
                  </button>
                </div>
              </div>
              {student.reason && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Reason: {student.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Student Detail Modal
  const StudentDetailModal = ({ student, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {student.fullName?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{student.fullName}</h3>
              <p className="text-gray-500">{student.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {student.isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'active' ? 'bg-green-100 text-green-800' :
                  student.status === 'transferred_out' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {student.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-medium">{student.grade}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-medium">{student.class}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Parent</p>
              <p className="font-medium">{student.parentName}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Parent Email</p>
              <p className="font-medium text-sm">{student.parentEmail}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Enrollment History</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Enrolled</span>
                <span className="font-medium">{student.isEnrolled ? 'Yes' : 'No'}</span>
              </div>
              {student.enrolledCourses && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Courses</span>
                  <span className="font-medium">{student.enrolledCourses.length}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                onClose();
                setSelectedStudent(student);
                setShowTransferModal(true);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Transfer Out
            </button>
            <button
              onClick={() => {
                onClose();
                setSelectedStudent(student);
                setShowDeleteModal(true);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600 mt-1">
            {totalStudents} total students • {totalEnrolled} enrolled • {totalRemoved} removed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRemovedStudents(!showRemovedStudents)}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <UserX className="w-4 h-4" />
            {showRemovedStudents ? 'View Students' : 'View Removed'}
          </button>
          <button
            onClick={() => setShowFinanceModal(!showFinanceModal)}
            className={`px-4 py-2.5 font-medium rounded-lg transition-colors flex items-center gap-2 ${
              showFinanceModal 
                ? 'bg-purple-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Finance
          </button>
          <button
            onClick={fetchStudents}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Enrolled</p>
              <p className="text-2xl font-bold text-emerald-600">{totalEnrolled}</p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transferred Out</p>
              <p className="text-2xl font-bold text-orange-600">
                {removedStudents.filter(s => s.reasonType === 'transfer_out').length}
              </p>
            </div>
            <UserMinus className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deleted</p>
              <p className="text-2xl font-bold text-red-600">
                {removedStudents.filter(s => s.reasonType === 'deleted').length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {showFinanceModal ? (
        <FinanceView />
      ) : showRemovedStudents ? (
        <RemovedStudentsView />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="transferred_out">Transferred Out</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <select
                  value={filterEnrollment}
                  onChange={(e) => setFilterEnrollment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Enrollment</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="not_enrolled">Not Enrolled</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="py-12 text-center">
                <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Student</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">ID</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Grade</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Enrollment</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {student.fullName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <code className="font-mono text-sm">{student.studentId}</code>
                        </td>
                        <td className="py-4 px-6">{student.grade}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            student.status === 'transferred_out' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.isEnrolled 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowStudentModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowTransferModal(true);
                              }}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="Transfer Out"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
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
            )}
          </div>
        </>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedStudent && (
        <TransferModal
          student={selectedStudent}
          onConfirm={(reason) => handleTransferStudent(selectedStudent, reason)}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStudent && (
        <DeleteConfirmationModal
          student={selectedStudent}
          onConfirm={() => handleDeleteStudent(selectedStudent)}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

// Transfer Modal Component
const TransferModal = ({ student, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    'Transfer to another school',
    'Family relocation',
    'Graduation',
    'Academic reasons',
    'Financial reasons',
    'Other'
  ];

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? otherReason : reason;
    if (!finalReason) {
      alert('Please provide a reason for transfer');
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transfer Student</h2>
            <p className="text-sm text-gray-500">{student.fullName} - {student.studentId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Transfer *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specify Reason
              </label>
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Please provide details..."
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ This student will be marked as "Transferred Out" and removed from active enrollment.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ student, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-md">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delete Student</h2>
          <p className="text-sm text-gray-500">{student.fullName} - {student.studentId}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Warning: This action cannot be undone!</p>
              <p className="text-sm mt-1">This student will be permanently deleted from the system.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Student: <span className="font-medium">{student.fullName}</span></p>
          <p className="text-sm text-gray-600">ID: <span className="font-medium">{student.studentId}</span></p>
          <p className="text-sm text-gray-600">Grade: <span className="font-medium">{student.grade}</span></p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Delete Permanently</button>
        </div>
      </div>
    </div>
  </div>
);

export default EnrollmentManagement;