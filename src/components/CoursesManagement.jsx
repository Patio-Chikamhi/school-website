import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, getDocs, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp, where, orderBy, arrayUnion, arrayRemove
} from 'firebase/firestore';
import {
  BookOpen, Plus, Edit, Trash2, Eye, Search, Filter,
  Users, Clock, Calendar, CheckCircle, XCircle,
  GraduationCap, Hash, Award, BookMarked, Loader,
  UserPlus, UserCheck, ChevronDown, ChevronUp, X
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const GRADE_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

const SUBJECT_OPTIONS = [
  'English',
  'Shona',
  'History',
  'Heritage',
  'Mathematics',
  'Combined Science',
  'Geography',
  'Agriculture',
  'FRS'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================
// MAIN COMPONENT
// ============================================

const CoursesManagement = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    subject: '',
    description: '',
    grade: '',
    sections: [],
    schedule: {
      days: [],
      time: '',
      room: ''
    },
    credits: 4,
    teacherIds: [],
    teacherNames: [],
    academicYear: '2024-25',
    isActive: true
  });

  // ============================================
  // AUTO-GENERATE COURSE ID
  // ============================================

  const generateCourseId = (subject, grade, existingCourses) => {
    if (!subject || !grade) return '';
    
    // Get subject code (first 3 letters uppercase)
    const subjectCode = subject.substring(0, 3).toUpperCase();
    
    // Get form code (e.g., "Form 1" -> "F1")
    const formCode = grade.replace('Form ', 'F');
    
    // Find existing courses with same subject and form
    const existing = existingCourses.filter(c => 
      c.subject === subject && c.grade === grade
    );
    
    // Generate sequential number
    const sequence = (existing.length + 1).toString().padStart(3, '0');
    
    return `${subjectCode}-${formCode}-${sequence}`;
  };

  // Auto-generate courseId and courseName when subject or grade changes
  useEffect(() => {
    if (formData.subject && formData.grade) {
      const newCourseId = generateCourseId(formData.subject, formData.grade, courses);
      setFormData(prev => ({
        ...prev,
        courseId: newCourseId,
        courseName: formData.subject // Auto-set course name from subject
      }));
    }
  }, [formData.subject, formData.grade, courses]);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'courses'),
        orderBy('courseName', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const coursesData = [];
      snapshot.forEach(doc => {
        coursesData.push({ id: doc.id, ...doc.data() });
      });
      
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const q = query(
        collection(db, 'teachers'),
        where('status', 'in', ['active', 'approved'])
      );
      const snapshot = await getDocs(q);
      
      const teachersData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        teachersData.push({
          id: doc.id,
          userId: data.userId || doc.id,
          teacherId: data.teacherId,
          name: data.personalInfo?.fullName || data.name,
          subjects: data.subjects || []
        });
      });
      
      setAvailableTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  // ============================================
  // FILTER AND SEARCH
  // ============================================

  useEffect(() => {
    let results = courses;
    
    if (filterGrade !== 'all') {
      results = results.filter(course => course.grade === filterGrade);
    }
    
    if (filterTeacher !== 'all') {
      results = results.filter(course => 
        course.teacherIds?.includes(filterTeacher) || 
        course.teacherId === filterTeacher
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(course => 
        course.courseName?.toLowerCase().includes(term) ||
        course.courseId?.toLowerCase().includes(term) ||
        course.subject?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term)
      );
    }
    
    setFilteredCourses(results);
  }, [searchTerm, filterGrade, filterTeacher, courses]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleAddCourse = async () => {
    try {
      // Check required fields (courseId is auto-generated)
      if (!formData.courseName || !formData.grade || !formData.subject) {
        alert('Please fill in all required fields (Subject, Name, and Form)');
        return;
      }
      
      // Check if course with same subject and grade already exists
      const existingCourse = courses.find(c => 
        c.subject === formData.subject && c.grade === formData.grade
      );
      if (existingCourse) {
        alert(`A course for "${formData.subject}" in "${formData.grade}" already exists.`);
        return;
      }
      
      const courseData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'courses'), courseData);
      
      // Update teachers' assigned courses
      for (const teacherId of formData.teacherIds) {
        const teacherQuery = query(collection(db, 'teachers'), where('userId', '==', teacherId));
        const teacherSnapshot = await getDocs(teacherQuery);
        if (!teacherSnapshot.empty) {
          const teacherDoc = teacherSnapshot.docs[0];
          await updateDoc(doc(db, 'teachers', teacherDoc.id), {
            assignedCourses: arrayUnion(formData.courseId),
            updatedAt: serverTimestamp()
          });
        }
      }
      
      alert('Course added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course. Please try again.');
    }
  };

  const handleEditCourse = async () => {
    try {
      if (!selectedCourse) return;
      
      const courseRef = doc(db, 'courses', selectedCourse.id);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      alert('Course updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      alert('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleAssignTeachers = async () => {
    if (!selectedCourse) return;
    
    try {
      const courseRef = doc(db, 'courses', selectedCourse.id);
      await updateDoc(courseRef, {
        teacherIds: formData.teacherIds,
        teacherNames: formData.teacherNames,
        updatedAt: serverTimestamp()
      });
      
      // Update teachers' assigned courses
      for (const teacherId of formData.teacherIds) {
        const teacherQuery = query(collection(db, 'teachers'), where('userId', '==', teacherId));
        const teacherSnapshot = await getDocs(teacherQuery);
        if (!teacherSnapshot.empty) {
          const teacherDoc = teacherSnapshot.docs[0];
          await updateDoc(doc(db, 'teachers', teacherDoc.id), {
            assignedCourses: arrayUnion(selectedCourse.courseId),
            updatedAt: serverTimestamp()
          });
        }
      }
      
      alert('Teachers assigned successfully!');
      setShowAssignModal(false);
      fetchCourses();
    } catch (error) {
      console.error('Error assigning teachers:', error);
      alert('Failed to assign teachers. Please try again.');
    }
  };

  const handleToggleActive = async (courseId, currentStatus) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchCourses();
    } catch (error) {
      console.error('Error toggling course status:', error);
      alert('Failed to update course status. Please try again.');
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      courseId: '',
      courseName: '',
      subject: '',
      description: '',
      grade: '',
      sections: [],
      schedule: {
        days: [],
        time: '',
        room: ''
      },
      credits: 4,
      teacherIds: [],
      teacherNames: [],
      academicYear: '2024-25',
      isActive: true
    });
    setSelectedCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      courseId: course.courseId || '',
      courseName: course.courseName || '',
      subject: course.subject || '',
      description: course.description || '',
      grade: course.grade || '',
      sections: Array.isArray(course.sections) ? course.sections : [],
      schedule: course.schedule || {
        days: [],
        time: '',
        room: ''
      },
      credits: course.credits || 4,
      teacherIds: course.teacherIds || (course.teacherId ? [course.teacherId] : []),
      teacherNames: course.teacherNames || (course.teacherName ? [course.teacherName] : []),
      academicYear: course.academicYear || '2024-25',
      isActive: course.isActive !== false
    });
    setShowEditModal(true);
  };

  const openViewModal = (course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  const openAssignModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      ...formData,
      teacherIds: course.teacherIds || (course.teacherId ? [course.teacherId] : []),
      teacherNames: course.teacherNames || (course.teacherName ? [course.teacherName] : [])
    });
    setShowAssignModal(true);
  };

  const handleTeacherToggle = (teacherId, teacherName) => {
    const currentIds = [...formData.teacherIds];
    const currentNames = [...formData.teacherNames];
    
    if (currentIds.includes(teacherId)) {
      setFormData({
        ...formData,
        teacherIds: currentIds.filter(id => id !== teacherId),
        teacherNames: currentNames.filter(name => name !== teacherName)
      });
    } else {
      setFormData({
        ...formData,
        teacherIds: [...currentIds, teacherId],
        teacherNames: [...currentNames, teacherName]
      });
    }
  };

  const handleDayToggle = (day) => {
    const currentDays = [...formData.schedule.days];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          days: currentDays.filter(d => d !== day)
        }
      });
    } else {
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          days: [...currentDays, day]
        }
      });
    }
  };

  const handleSectionChange = (index, value) => {
    const newSections = [...formData.sections];
    newSections[index] = value;
    setFormData({ ...formData, sections: newSections });
  };

  const addSection = () => {
    setFormData({ 
      ...formData, 
      sections: [...formData.sections, ''] 
    });
  };

  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: newSections });
  };

  const toggleCourseExpand = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Courses Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage school courses, schedules, and teacher assignments
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Add New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Courses</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Active Courses</p>
              <p className="text-xl sm:text-3xl font-bold text-green-600">
                {courses.filter(c => c.isActive !== false).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Teachers Assigned</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600">
                {new Set(courses.flatMap(c => c.teacherIds || [c.teacherId]).filter(Boolean)).size}
              </p>
            </div>
            <Users className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Forms Covered</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-600">
                {new Set(courses.map(c => c.grade).filter(Boolean)).size}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course name, ID, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-44">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
              >
                <option value="all">All Forms</option>
                {GRADE_OPTIONS.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-44">
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
              >
                <option value="all">All Teachers</option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.userId} value={teacher.userId}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={fetchCourses}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm sm:text-base"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <Loader className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">No courses found</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              {searchTerm || filterGrade !== 'all' || filterTeacher !== 'all'
                ? 'Try changing your search or filter criteria'
                : 'No courses have been added yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teachers
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map(course => {
                  const teacherCount = (course.teacherIds || [course.teacherId]).filter(Boolean).length;
                  return (
                    <React.Fragment key={course.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleCourseExpand(course.id)}>
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {course.courseName}
                              {course.subject && (
                                <span className="ml-2 text-xs text-gray-500">({course.subject})</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {course.courseId}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {course.academicYear}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {course.grade}
                          </div>
                          <div className="text-sm text-gray-500">
                            Sections: {course.sections?.length || 0}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Credits: {course.credits}
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {teacherCount > 0 ? (
                              <>
                                <span className="text-sm text-gray-900">
                                  {teacherCount} teacher(s)
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAssignModal(course);
                                  }}
                                  className="ml-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Manage
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignModal(course);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + Assign
                              </button>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${
                            course.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {course.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2 sm:space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openViewModal(course);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(course);
                              }}
                              className="text-emerald-600 hover:text-emerald-900"
                              title="Edit Course"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(course.id, course.isActive !== false);
                              }}
                              className={course.isActive !== false ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                              title={course.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              {course.isActive !== false ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCourse === course.id && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-4 sm:px-6 py-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                                {course.schedule ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Days:</span>
                                      <span className="ml-2 text-gray-900">
                                        {Array.isArray(course.schedule.days) 
                                          ? course.schedule.days.join(', ')
                                          : course.schedule.days}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Time:</span>
                                      <span className="ml-2 text-gray-900">{course.schedule.time}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Room:</span>
                                      <span className="ml-2 text-gray-900">{course.schedule.room}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">No schedule set</p>
                                )}
                              </div>
                              {course.description && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                  <p className="text-gray-700 text-sm">{course.description}</p>
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Assigned Teachers</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(course.teacherIds || [course.teacherId]).filter(Boolean).map((teacherId, idx) => {
                                    const teacherName = (course.teacherNames || [course.teacherName])[idx];
                                    return (
                                      <span key={teacherId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {teacherName || teacherId}
                                      </span>
                                    );
                                  })}
                                  {(!course.teacherIds || course.teacherIds.length === 0) && !course.teacherId && (
                                    <p className="text-gray-500 text-sm">No teachers assigned</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ADD/EDIT COURSE MODAL */}
      {/* ============================================ */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {showAddModal ? 'Add New Course' : 'Edit Course'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {showAddModal ? 'Create a new course with auto-generated ID' : 'Update course information'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course ID - Auto-generated */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course ID <span className="text-xs text-gray-500">(Auto-generated)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.courseId}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated from subject and form
                      </p>
                    </div>
                    
                    {/* Subject - Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      >
                        <option value="">Select Subject</option>
                        {SUBJECT_OPTIONS.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course Name - Auto-filled */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Name *
                      </label>
                      <input
                        type="text"
                        value={formData.courseName}
                        onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="Auto-filled from subject"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-filled from subject selection</p>
                    </div>
                    
                    {/* Grade/Form - Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Form *
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      >
                        <option value="">Select Form</option>
                        {GRADE_OPTIONS.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="Course description..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.credits}
                        onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value) || 4})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="e.g., 2024-25"
                      />
                    </div>
                  </div>
                </div>

                {/* Teacher Assignment */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Teacher Assignment
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {availableTeachers.map(teacher => (
                        <label key={teacher.userId} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.teacherIds.includes(teacher.userId)}
                            onChange={() => handleTeacherToggle(teacher.userId, teacher.name)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">{teacher.name}</span>
                          <span className="ml-auto text-xs text-gray-500">{teacher.teacherId}</span>
                        </label>
                      ))}
                      {availableTeachers.length === 0 && (
                        <p className="text-gray-500 text-center py-4 text-sm">No teachers available</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Select one or more teachers for this course</p>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Sections
                  </h3>
                  
                  <div className="space-y-2">
                    {formData.sections.map((section, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => handleSectionChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          placeholder="e.g., A, B, C"
                        />
                        <button
                          onClick={() => removeSection(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addSection}
                      className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Section
                    </button>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Schedule
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            formData.schedule.days.includes(day)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="text"
                        value={formData.schedule.time}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {...formData.schedule, time: e.target.value}
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="e.g., 10:00 AM - 11:00 AM"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room
                      </label>
                      <input
                        type="text"
                        value={formData.schedule.room}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {...formData.schedule, room: e.target.value}
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="e.g., Room 101"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active Course
                  </label>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8 flex-shrink-0">
              <div className="flex justify-end space-x-3 sm:space-x-4">
                <button
                  onClick={() => {
                    showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAddCourse : handleEditCourse}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm sm:text-base"
                >
                  {showAddModal ? 'Add Course' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ASSIGN TEACHERS MODAL */}
      {/* ============================================ */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Assign Teachers
                  </h2>
                  <p className="text-sm text-gray-500">{selectedCourse.courseName}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select teachers to assign to this course:</p>
                
                <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {availableTeachers.map(teacher => (
                      <label key={teacher.userId} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.teacherIds.includes(teacher.userId)}
                          onChange={() => handleTeacherToggle(teacher.userId, teacher.name)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{teacher.name}</span>
                        <span className="ml-auto text-xs text-gray-500">{teacher.teacherId}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTeachers}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                  >
                    Assign Teachers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* VIEW COURSE MODAL */}
      {/* ============================================ */}
      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {selectedCourse.courseName}
                  </h2>
                  <p className="text-gray-600 text-sm">ID: {selectedCourse.courseId}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Form</p>
                      <p className="font-medium">{selectedCourse.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="font-medium">{selectedCourse.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Credits</p>
                      <p className="font-medium">{selectedCourse.credits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Academic Year</p>
                      <p className="font-medium">{selectedCourse.academicYear}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCourse.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCourse.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedCourse.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="mt-1 text-gray-700">{selectedCourse.description}</p>
                    </div>
                  )}
                </div>

                {/* Teachers Information */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Assigned Teachers</h3>
                  <div className="space-y-3">
                    {(selectedCourse.teacherIds || [selectedCourse.teacherId]).filter(Boolean).map((teacherId, idx) => {
                      const teacherName = (selectedCourse.teacherNames || [selectedCourse.teacherName])[idx];
                      return (
                        <div key={teacherId} className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacherName || 'Teacher'}</p>
                            <p className="text-sm text-gray-600">Teacher ID: {teacherId}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!selectedCourse.teacherIds || selectedCourse.teacherIds.length === 0) && !selectedCourse.teacherId && (
                      <p className="text-gray-500 text-center py-4">No teachers assigned</p>
                    )}
                  </div>
                </div>

                {/* Sections */}
                {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.sections.map((section, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          Section {section}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule */}
                {selectedCourse.schedule && (
                  <div className="bg-emerald-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Schedule</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-emerald-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {Array.isArray(selectedCourse.schedule.days) 
                              ? selectedCourse.schedule.days.join(', ')
                              : selectedCourse.schedule.days}
                          </p>
                          <p className="text-sm text-gray-600">{selectedCourse.schedule.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-emerald-600 mr-3" />
                        <p className="text-gray-700">{selectedCourse.schedule.room}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesManagement;