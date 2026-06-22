import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Phone, Link as LinkIcon, Unlink, Search, 
  Filter, Download, Edit, Trash2, Eye, RefreshCw, X, Check,
  UserCheck, Shield, Key, Send, Plus, ChevronRight, Loader,
  AlertCircle, Calendar, GraduationCap, Home
} from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  writeBatch, orderBy, limit, setDoc  // ✅ Added setDoc here
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch parents
      const parentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'parent'),
        orderBy('createdAt', 'desc')
      );
      const parentsSnapshot = await getDocs(parentsQuery);
      const parentsData = parentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setParents(parentsData);

      // Fetch students
      const studentsQuery = query(collection(db, 'students'), orderBy('fullName'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(parent => {
    const matchesSearch = 
      parent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.phone?.includes(searchQuery) ||
      parent.linkedStudents?.some(studentId => {
        const student = students.find(s => s.id === studentId);
        return student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               student?.studentId?.includes(searchQuery);
      });

    const matchesStatus = filterStatus === 'all' || parent.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStudentInfo = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student || null;
  };

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm('Are you sure you want to delete this parent account? This will unlink all students.')) {
      return;
    }

    setActionLoading(true);
    try {
      const parent = parents.find(p => p.id === parentId);
      if (parent?.linkedStudents) {
        for (const studentId of parent.linkedStudents) {
          const studentDocRef = doc(db, 'students', studentId);
          await updateDoc(studentDocRef, {
            parentEmail: '',
            parentName: '',
            updatedAt: serverTimestamp()
          });
        }
      }

      await deleteDoc(doc(db, 'users', parentId));

      alert('Parent account deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting parent:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (parentEmail) => {
    try {
      await sendPasswordResetEmail(auth, parentEmail);
      alert('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleToggleStatus = async (parentId, currentStatus) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', parentId), {
        status: currentStatus === 'active' ? 'inactive' : 'active',
        updatedAt: serverTimestamp()
      });
      fetchData();
      alert(`Parent ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Management</h2>
          <p className="text-gray-600">Manage parent accounts and student links</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Parent
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Parents</p>
              <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {parents.filter(p => p.status === 'active').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Linked Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {parents.reduce((acc, parent) => acc + (parent.linkedStudents?.length || 0), 0)}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Setup</p>
              <p className="text-2xl font-bold text-gray-900">
                {parents.filter(p => p.mustChangePassword).length}
              </p>
            </div>
            <Key className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search parents or students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Parents List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Loading parents...</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No parents found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try changing your search criteria'
                : 'No parent accounts in the system yet'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
            >
              Add First Parent
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredParents.map(parent => (
              <div key={parent.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Parent Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {parent.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{parent.name || 'Unknown Parent'}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(parent.status)}`}>
                            {parent.status || 'active'}
                          </span>
                          {parent.mustChangePassword && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                              Setup Required
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {parent.email}
                            </span>
                            {parent.phone && (
                              <span className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4" />
                                {parent.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Joined: {parent.createdAt?.toLocaleDateString() || 'Recently'}
                            </span>
                          </div>
                        </div>

                        {/* Linked Students */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Students:</h4>
                          <div className="space-y-2">
                            {parent.linkedStudents?.map(studentId => {
                              const student = getStudentInfo(studentId);
                              return student ? (
                                <div key={studentId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                      <span className="text-emerald-600 font-medium text-sm">
                                        {student.fullName?.charAt(0) || 'S'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{student.fullName}</p>
                                      <p className="text-xs text-gray-500">
                                        {student.studentId} • {student.grade} • {student.section}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleUnlinkStudent(parent.id, studentId)}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    title="Unlink student"
                                  >
                                    <Unlink className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : null;
                            })}
                            
                            {(!parent.linkedStudents || parent.linkedStudents.length === 0) && (
                              <div className="text-center py-3 text-gray-500 text-sm">
                                No students linked
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedParent(parent);
                        setShowLinkModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Link Student
                    </button>
                    <button
                      onClick={() => handleResetPassword(parent.email)}
                      className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleToggleStatus(parent.id, parent.status)}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        parent.status === 'active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {parent.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteParent(parent.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <AddParentModal
          onClose={() => {
            setShowAddModal(false);
            fetchData();
          }}
          students={students}
        />
      )}

      {/* Link Student Modal */}
      {selectedParent && showLinkModal && (
        <LinkStudentModal
          parent={selectedParent}
          students={students}
          onClose={() => {
            setSelectedParent(null);
            setShowLinkModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ParentManagement;

// Add Parent Modal Component - FIXED with sessionStorage protection
const AddParentModal = ({ onClose, students }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    createAuthAccount: true,
    autoGeneratePassword: true,
    customPassword: '',
    linkStudents: [],
    sendWelcomeEmail: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Parent name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      // ✅ IMPORTANT: Store flag before creating user to prevent redirect
      sessionStorage.setItem('adminCreatingUser', 'true');

      const password = formData.autoGeneratePassword 
        ? generateStrongPassword()
        : formData.customPassword;
      
      setGeneratedPassword(password);

      const parentData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: 'parent',
        status: 'active',
        linkedStudents: formData.linkStudents,
        permissions: {
          viewGrades: true,
          viewAttendance: true,
          viewAssignments: true,
          viewReports: true,
          receiveNotifications: true
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mustChangePassword: formData.createAuthAccount,
        tempPassword: password
      };

      let authUid = null;

      if (formData.createAuthAccount) {
        try {
          // ✅ Check if email already exists
          const existingUserQuery = query(
            collection(db, 'users'),
            where('email', '==', formData.email.trim().toLowerCase()),
            where('role', '==', 'parent')
          );
          const existingUserSnapshot = await getDocs(existingUserQuery);
          
          if (!existingUserSnapshot.empty) {
            // User exists, use existing document
            const existingDoc = existingUserSnapshot.docs[0];
            authUid = existingDoc.id;
            
            await updateDoc(doc(db, 'users', authUid), {
              ...parentData,
              linkedStudents: arrayUnion(...formData.linkStudents),
              updatedAt: serverTimestamp()
            });
          } else {
            // ✅ Create new auth user (with session protection)
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              formData.email.trim().toLowerCase(),
              password
            );
            authUid = userCredential.user.uid;
            parentData.uid = authUid;
            
            await updateProfile(userCredential.user, {
              displayName: formData.name.trim()
            });
            
            // Create new user document
            await setDoc(doc(db, 'users', authUid), parentData);
          }
        } catch (authError) {
          console.error('Auth creation failed:', authError);
          if (authError.code === 'auth/email-already-in-use') {
            // Email exists, find the user
            const existingUserQuery = query(
              collection(db, 'users'),
              where('email', '==', formData.email.trim().toLowerCase())
            );
            const existingUserSnapshot = await getDocs(existingUserQuery);
            if (!existingUserSnapshot.empty) {
              const existingDoc = existingUserSnapshot.docs[0];
              authUid = existingDoc.id;
              await updateDoc(doc(db, 'users', authUid), {
                ...parentData,
                updatedAt: serverTimestamp()
              });
            }
          } else {
            // Create without auth account
            parentData.status = 'inactive';
            parentData.mustChangePassword = false;
            const docRef = doc(collection(db, 'users'));
            await setDoc(docRef, parentData);
          }
        }
      } else {
        // No auth account, just create user document
        const docRef = doc(collection(db, 'users'));
        await setDoc(docRef, parentData);
      }

      // Link students
      for (const studentId of formData.linkStudents) {
        const studentDocRef = doc(db, 'students', studentId);
        await updateDoc(studentDocRef, {
          parentEmail: formData.email.trim(),
          parentName: formData.name.trim(),
          parentId: authUid || `parent_${Date.now()}`,
          updatedAt: serverTimestamp()
        });
      }

      // ✅ Clear the flag after user creation
      setTimeout(() => {
        sessionStorage.removeItem('adminCreatingUser');
      }, 1000);

      setSuccess(`✅ Parent account created successfully! 
        Email: ${formData.email}
        ${formData.createAuthAccount ? `Password: ${password}` : 'No auth account created.'}
      `);
      
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error creating parent:', error);
      setError(error.message);
      // ✅ Clear flag on error
      sessionStorage.removeItem('adminCreatingUser');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    const text = `Parent Account Created\nEmail: ${formData.email}\nPassword: ${generatedPassword}\n\nPlease change password on first login.`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Parent</h2>
            <p className="text-sm text-gray-500">Create a new parent account</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Jane Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="parent@email.com" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="+1 (555) 123-4567" />
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Account Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.createAuthAccount} onChange={(e) => setFormData({...formData, createAuthAccount: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">Create login account (recommended)</span>
                </label>

                {formData.createAuthAccount && (
                  <div className="ml-7 space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={formData.autoGeneratePassword} onChange={(e) => setFormData({...formData, autoGeneratePassword: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">Auto-generate secure password</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Link Students */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Link Students</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select students to link</label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <input type="checkbox" checked={formData.linkStudents.includes(student.id)} onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, linkStudents: [...formData.linkStudents, student.id]});
                        } else {
                          setFormData({...formData, linkStudents: formData.linkStudents.filter(id => id !== student.id)});
                        }
                      }} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-sm text-gray-500">{student.studentId} • Grade {student.grade} • {student.section}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-5 h-5" />
                  <div className="text-sm whitespace-pre-line">{success}</div>
                  {generatedPassword && (
                    <button onClick={copyCredentials} className="ml-2 text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700">
                      Copy
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader className="w-5 h-5 animate-spin" />Creating...</> : <><UserPlus className="w-5 h-5" />Create Parent Account</>}
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Link Student Modal Component
const LinkStudentModal = ({ parent, students, onClose }) => {
  const [selectedStudents, setSelectedStudents] = useState(parent.linkedStudents || []);
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      // Update parent document
      await updateDoc(doc(db, 'users', parent.id), {
        linkedStudents: selectedStudents,
        updatedAt: serverTimestamp()
      });

      // Update student documents
      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          await updateDoc(doc(db, 'students', studentId), {
            parentEmail: parent.email,
            parentName: parent.name,
            updatedAt: serverTimestamp()
          });
        }
      }

      alert('Students linked successfully!');
      onClose();
    } catch (error) {
      console.error('Error linking students:', error);
      alert('Error linking students: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div><h2 className="text-xl font-bold">Link Students</h2><p className="text-sm text-gray-500">Link students to {parent.name}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map(student => (
              <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => toggleStudent(student.id)}>
                <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => {}} className="w-4 h-4" />
                <div><div className="font-medium">{student.fullName}</div><div className="text-sm text-gray-500">{student.studentId} • {student.grade}</div></div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button onClick={handleLink} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{loading ? 'Linking...' : 'Link Selected Students'}</button>
            <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};