// src/components/TeacherApprovals.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, updateDoc, doc, 
  serverTimestamp, deleteDoc, getDoc, setDoc
} from 'firebase/firestore';
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  Mail, Phone, GraduationCap, BookOpen, Calendar,
  Eye, UserCheck, UserX, Award, Briefcase, User,
  ChevronRight, Loader, X
} from 'lucide-react';

const TeacherApprovals = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    total: 0
  });

  // ✅ FIXED: Safe date formatter
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (typeof timestamp?.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Handle string dates
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      // Handle Date objects
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      return 'Invalid Date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'teachers'));
      const snapshot = await getDocs(q);
      
      const teachersData = [];
      snapshot.forEach(doc => {
        teachersData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('📊 Fetched teachers:', teachersData.length);
      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
      updateStats(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (teachersList) => {
    const newStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      total: teachersList.length
    };

    teachersList.forEach(teacher => {
      const status = teacher.status || 'pending';
      if (newStats[status] !== undefined) {
        newStats[status]++;
      } else {
        newStats.pending++;
      }
    });

    setStats(newStats);
  };

  // Filter and search
  useEffect(() => {
    let results = teachers;
    
    if (filterStatus !== 'all') {
      results = results.filter(teacher => (teacher.status || 'pending') === filterStatus);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(teacher => {
        const fullName = `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''}`.toLowerCase();
        const email = teacher.personalInfo?.email?.toLowerCase() || '';
        const subjects = teacher.subjects?.join(' ').toLowerCase() || '';
        
        return fullName.includes(term) || email.includes(term) || subjects.includes(term);
      });
    }
    
    setFilteredTeachers(results);
  }, [searchTerm, filterStatus, teachers]);

  const handleApprove = async (teacherId, immediateActivation = false) => {
    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacher = teachers.find(t => t.id === teacherId);
      
      if (!teacher) {
        alert('Teacher not found');
        return;
      }
      
      // Update user document
      const userRef = doc(db, 'users', teacher.userId || teacherId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: teacher.userId || teacherId,
          email: teacher.personalInfo?.email,
          name: teacher.personalInfo?.fullName,
          role: 'teacher',
          status: 'active',
          mustChangePassword: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          status: 'active',
          role: 'teacher',
          mustChangePassword: false,
          updatedAt: serverTimestamp()
        });
      }
      
      // Update teacher document
      const existingHistory = teacher.statusHistory || {};
      
      await updateDoc(teacherRef, {
        status: 'active',
        meta: {
          ...teacher.meta,
          approvedAt: serverTimestamp(),
          approvedBy: 'admin',
          activatedAt: serverTimestamp()
        },
        statusHistory: {
          ...existingHistory,
          active: {
            status: 'active',
            date: new Date().toISOString(),
            note: 'Teacher approved and activated by admin'
          }
        }
      });
      
      await fetchTeachers();
      alert('✅ Teacher approved and activated successfully!');
      
    } catch (error) {
      console.error('Error approving teacher:', error);
      alert('Failed to approve teacher: ' + error.message);
    }
  };

  const handleReject = async (teacherId) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;
    
    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacher = teachers.find(t => t.id === teacherId);
      
      await updateDoc(teacherRef, {
        status: 'rejected',
        rejectionReason: reason,
        meta: {
          ...teacher?.meta,
          rejectedAt: serverTimestamp()
        },
        statusHistory: {
          ...teacher?.statusHistory,
          rejected: {
            status: 'rejected',
            date: new Date().toISOString(),
            note: `Application rejected: ${reason}`
          }
        }
      });
      
      await fetchTeachers();
      alert('Teacher application rejected.');
      
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      alert('Failed to reject teacher.');
    }
  };

  const handleViewDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Applications</h1>
        <p className="text-gray-600 mt-2">Review and manage teacher applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Teachers</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <UserX className="w-12 h-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <button
            onClick={fetchTeachers}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading teacher applications...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No teachers found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {teacher.personalInfo?.firstName?.[0]}{teacher.personalInfo?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{teacher.personalInfo?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects?.slice(0, 2).map(subject => (
                          <span key={subject} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {teacher.professionalInfo?.experienceYears || 0} years
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(teacher.meta?.applicationDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
                        {getStatusIcon(teacher.status)}
                        <span className="ml-1 capitalize">{teacher.status || 'pending'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(teacher)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {(teacher.status === 'pending' || !teacher.status) && (
                          <>
                            <button
                              onClick={() => handleApprove(teacher.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(teacher.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedTeacher.personalInfo?.firstName} {selectedTeacher.personalInfo?.lastName}
              </h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <p><strong>Email:</strong> {selectedTeacher.personalInfo?.email}</p>
                  <p><strong>Phone:</strong> {selectedTeacher.personalInfo?.phone}</p>
                  <p><strong>Address:</strong> {selectedTeacher.personalInfo?.address}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Professional Information</h3>
                  <p><strong>Experience:</strong> {selectedTeacher.professionalInfo?.experienceYears} years</p>
                  <p><strong>Qualifications:</strong> {selectedTeacher.professionalInfo?.qualifications?.join(', ')}</p>
                  <p><strong>Subjects:</strong> {selectedTeacher.subjects?.join(', ')}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg">
                  Close
                </button>
                {(selectedTeacher.status === 'pending' || !selectedTeacher.status) && (
                  <button
                    onClick={() => {
                      handleApprove(selectedTeacher.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Teacher
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherApprovals;