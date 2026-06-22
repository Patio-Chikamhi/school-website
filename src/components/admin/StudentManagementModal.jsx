import React, { useState, useEffect } from 'react';
import { X, Search, User, Mail, Phone, GraduationCap, Home, Shield, Edit, Trash2, Plus, Filter, Download, Eye, MoreVertical, CheckCircle, XCircle, Clock, Calendar, Users, Award } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentManagementModal = ({ onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    grade: '9',
    section: 'A',
    address: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    status: 'active',
    studentId: '',
    birthDate: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  const gradeOptions = ['all', '6', '7', '8', '9', '10', '11', '12'];
  const statusOptions = [
    { value: 'all', label: 'All Students', color: 'gray' },
    { value: 'active', label: 'Active', color: 'emerald' },
    { value: 'inactive', label: 'Inactive', color: 'red' },
    { value: 'graduated', label: 'Graduated', color: 'blue' },
    { value: 'suspended', label: 'Suspended', color: 'orange' }
  ];

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, orderBy('fullName'));
        const snapshot = await getDocs(q);
        
        const studentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents(getMockStudents());
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getMockStudents = () => {
    return [
      {
        id: '1',
        studentId: 'STU2024001',
        fullName: 'John Smith',
        email: 'john.smith@school.edu',
        phone: '+1 (555) 123-4567',
        grade: '10',
        section: 'A',
        address: '123 Main St, City, State',
        parentName: 'Jane Smith',
        parentEmail: 'jane.smith@email.com',
        parentPhone: '+1 (555) 987-6543',
        status: 'active',
        enrollmentDate: '2023-08-15',
        birthDate: '2008-05-15',
        gpa: '3.8',
        attendance: '95%'
      }
    ];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' || 
      student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STU${year}${random}`;
  };

  const handleAddStudent = async () => {
    if (!formData.fullName || !formData.email) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setProcessing(true);
      const studentId = formData.studentId || generateStudentId();
      const newStudent = {
        ...formData,
        studentId,
        enrollmentDate: formData.enrollmentDate || new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        enrollmentStatus: 'enrolled',
        isEnrolled: true,
        enrolledCourses: []
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'students'), newStudent);
      
      // Update local state
      setStudents(prev => [...prev, { id: docRef.id, ...newStudent }]);
      
      // Reset form
      resetForm();
      setShowAddForm(false);
      
      alert(`✅ Student added successfully!\nStudent ID: ${studentId}`);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('❌ Failed to add student: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !formData.fullName || !formData.email) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setProcessing(true);
      
      // Update in Firestore
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === editingStudent.id 
          ? { ...student, ...formData }
          : student
      ));
      
      // Reset
      resetForm();
      setEditingStudent(null);
      
      alert('✅ Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('❌ Failed to update student: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?\nThis action cannot be undone.')) return;

    try {
      setProcessing(true);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'students', studentId));
      
      // Update local state
      setStudents(prev => prev.filter(student => student.id !== studentId));
      
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
      
      alert('✅ Student deleted successfully!');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('❌ Failed to delete student: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      setProcessing(true);
      
      // Update in Firestore
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, status: newStatus }
          : student
      ));
      
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(prev => ({ ...prev, status: newStatus }));
      }
      
      alert('✅ Student status updated!');
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('❌ Failed to update status: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'graduated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      grade: '9',
      section: 'A',
      address: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      status: 'active',
      studentId: '',
      birthDate: '',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
    setEditingStudent(null);
    setShowAddForm(false);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName || '',
      email: student.email || '',
      phone: student.phone || '',
      grade: student.grade || '9',
      section: student.section || 'A',
      address: student.address || '',
      parentName: student.parentName || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      status: student.status || 'active',
      studentId: student.studentId || '',
      birthDate: student.birthDate || '',
      enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0]
    });
    setShowAddForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <p className="text-gray-600">Manage all student records</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Grades</option>
              {gradeOptions.filter(g => g !== 'all').map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Student List */}
          <div className={`w-1/2 border-r border-gray-200 overflow-y-auto ${showAddForm ? 'hidden md:block' : 'w-full'}`}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">Try changing your search criteria or add a new student</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedStudent?.id === student.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.fullName}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                Grade {student.grade}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                                {student.studentId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.status)}`}>
                          {student.status?.charAt(0)?.toUpperCase() + student.status?.slice(1)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStudent(student);
                            }}
                            className="p-1 text-gray-600 hover:text-emerald-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(student.id);
                            }}
                            className="p-1 text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Form or Student Details */}
          <div className={`${showAddForm ? 'w-full md:w-1/2' : 'w-1/2'} overflow-y-auto p-6`}>
            {showAddForm ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h3>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  editingStudent ? handleUpdateStudent() : handleAddStudent();
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="student@school.edu"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="+1234567890"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                      </label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="STU2024001"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        {gradeOptions.filter(g => g !== 'all').map(grade => (
                          <option key={grade} value={grade}>Grade {grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="A"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enrollment Date
                      </label>
                      <input
                        type="date"
                        name="enrollmentDate"
                        value={formData.enrollmentDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="123 Main Street, City, State"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Jane Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        name="parentEmail"
                        value={formData.parentEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="parent@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="+1234567890"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : editingStudent ? 'Update Student' : 'Add Student'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedStudent ? (
              <div className="space-y-6">
                {/* Student Details View */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedStudent.fullName}</h3>
                      <p className="text-gray-600">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedStudent.status)}`}>
                    {selectedStudent.status?.charAt(0)?.toUpperCase() + selectedStudent.status?.slice(1)}
                  </span>
                </div>
                
                {/* Student Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs text-gray-500 mb-1">Student ID</label>
                    <p className="font-medium">{selectedStudent.studentId}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs text-gray-500 mb-1">Grade & Section</label>
                    <p className="font-medium">Grade {selectedStudent.grade} - {selectedStudent.section}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <p className="font-medium">{selectedStudent.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs text-gray-500 mb-1">Enrollment Date</label>
                    <p className="font-medium">{selectedStudent.enrollmentDate || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Parent Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Parent/Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Parent Name</label>
                      <p className="font-medium">{selectedStudent.parentName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Parent Email</label>
                      <p className="font-medium">{selectedStudent.parentEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Parent Phone</label>
                      <p className="font-medium">{selectedStudent.parentPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Address</label>
                      <p className="font-medium">{selectedStudent.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleEditStudent(selectedStudent)}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Student
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(selectedStudent.id)}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
                
                {/* Status Change Options */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Change Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedStudent.id, 'active')}
                      disabled={selectedStudent.status === 'active' || processing}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      Mark Active
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedStudent.id, 'inactive')}
                      disabled={selectedStudent.status === 'inactive' || processing}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Mark Inactive
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedStudent.id, 'graduated')}
                      disabled={selectedStudent.status === 'graduated' || processing}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      Mark Graduated
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedStudent.id, 'suspended')}
                      disabled={selectedStudent.status === 'suspended' || processing}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
                  <p className="text-gray-600">Choose a student from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {/* Export functionality */}}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export List
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagementModal;