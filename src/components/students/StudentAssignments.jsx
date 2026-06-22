// src/components/students/StudentAssignments.jsx - COMPLETE WITH FILE UPLOAD
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Upload,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  BookOpen,
  Eye,
  Download,
  XCircle,
  Users,
  Paperclip,
  Loader
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

const StudentAssignments = ({ studentId, enrolledCourses }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState({});

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId || !enrolledCourses || enrolledCourses.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get course IDs
        const courseIds = enrolledCourses.map(c => c.courseId || c.id);
        
        // Fetch assignments for enrolled courses
        let allAssignments = [];
        for (const courseId of courseIds) {
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('courseId', '==', courseId),
            where('status', '==', 'active'),
            where('term', '==', activeTerm),
            orderBy('dueDate', 'asc')
          );
          const snapshot = await getDocs(assignmentsQuery);
          snapshot.forEach(doc => {
            const data = doc.data();
            allAssignments.push({
              id: doc.id,
              ...data,
              dueDate: data.dueDate?.toDate?.() || new Date(data.dueDate),
              createdAt: data.createdAt?.toDate?.() || new Date()
            });
          });
        }
        
        // Fetch student's submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('studentId', '==', studentId)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsMap = {};
        submissionsSnapshot.forEach(doc => {
          const data = doc.data();
          submissionsMap[data.assignmentId] = {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            gradedAt: data.gradedAt?.toDate?.()
          };
        });
        
        // Merge assignments with submissions
        const now = new Date();
        const assignmentsWithStatus = allAssignments.map(assignment => {
          const submission = submissionsMap[assignment.id];
          const isOverdue = assignment.dueDate && assignment.dueDate < now && !submission;
          
          return {
            ...assignment,
            submission: submission || null,
            submitted: !!submission,
            graded: submission?.graded || false,
            grade: submission?.grade,
            feedback: submission?.feedback,
            status: submission ? (submission.graded ? 'graded' : 'submitted') : (isOverdue ? 'overdue' : 'pending')
          };
        });
        
        setAssignments(assignmentsWithStatus);
        setSubmissions(submissionsMap);
        
        // Prepare courses for filter
        const uniqueCourses = [...new Set(assignmentsWithStatus.map(a => a.courseId))];
        setCourses([
          { id: 'all', name: 'All Courses' },
          ...uniqueCourses.map(cid => ({
            id: cid,
            name: assignmentsWithStatus.find(a => a.courseId === cid)?.courseName || cid
          }))
        ]);
        
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [studentId, enrolledCourses]);

  const handleSubmitAssignment = async (assignment) => {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.png,.zip,.txt';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Optional: Add comments
      const comments = prompt('Add any comments for your teacher (optional):', '');
      
      setSubmitting(assignment.id);
      try {
        // Upload file to Storage
        const fileName = `submissions/${assignment.id}/${studentId}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(storageRef);
        
        // Create submission document
        const submissionData = {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          studentId: studentId,
          studentName: '', // Will be populated from user data
          fileUrl: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          submittedAt: new Date(),
          graded: false,
          grade: null,
          feedback: null,
          comments: comments || '',
          assignmentType: assignment.assignmentType,
          courseId: assignment.courseId,
          courseName: assignment.courseName
        };
        
        await addDoc(collection(db, 'submissions'), submissionData);
        
        // Refresh assignments
        const updatedAssignments = assignments.map(a => 
          a.id === assignment.id 
            ? { ...a, submitted: true, status: 'submitted', submission: submissionData }
            : a
        );
        setAssignments(updatedAssignments);
        
        alert('✅ Assignment submitted successfully!');
      } catch (error) {
        console.error('Error submitting assignment:', error);
        alert('Error submitting assignment: ' + error.message);
      } finally {
        setSubmitting(null);
      }
    };
    
    fileInput.click();
  };

  const handleDownloadAttachment = (url, fileName) => {
    window.open(url, '_blank');
  };

  const handleViewSubmission = (submission) => {
    if (submission?.fileUrl) {
      window.open(submission.fileUrl, '_blank');
    }
  };

  const calculateStats = () => {
    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
    const submittedAssignments = assignments.filter(a => a.status === 'submitted').length;
    const gradedAssignments = assignments.filter(a => a.status === 'graded').length;
    const overdueAssignments = assignments.filter(a => a.status === 'overdue').length;
    
    const submissionRate = totalAssignments > 0 
      ? ((submittedAssignments + gradedAssignments) / totalAssignments * 100).toFixed(1)
      : 0;
    
    return {
      totalAssignments,
      pendingAssignments,
      submittedAssignments,
      gradedAssignments,
      overdueAssignments,
      submissionRate: parseFloat(submissionRate)
    };
  };

  const stats = calculateStats();

  const filteredAssignments = assignments.filter(assignment => {
    if (searchQuery && !assignment.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCourse !== 'all' && assignment.courseId !== selectedCourse) {
      return false;
    }
    if (filter !== 'all' && assignment.status !== filter) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'bg-emerald-100 text-emerald-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'graded': return 'Graded';
      case 'submitted': return 'Submitted';
      case 'overdue': return 'Overdue';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const formatDueDate = (dueDate, status) => {
    if (!dueDate) return 'No due date';
    if (status === 'submitted' || status === 'graded') return 'Submitted';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">View, submit, and track your assignments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.totalAssignments}</div>
              <div className="text-sm opacity-90 mt-1">Total Assignments</div>
            </div>
            <FileText className="w-10 h-10 opacity-80" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingAssignments}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.pendingAssignments / Math.max(stats.totalAssignments, 1)) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{stats.submittedAssignments + stats.gradedAssignments}</div>
              <div className="text-sm text-gray-500">Submitted</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((stats.submittedAssignments + stats.gradedAssignments) / Math.max(stats.totalAssignments, 1)) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">{stats.overdueAssignments}</div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.overdueAssignments / Math.max(stats.totalAssignments, 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {assignment.assignmentType || 'Assignment'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {getStatusText(assignment.status)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDueDate(assignment.dueDate, assignment.status)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {assignment.totalPoints || assignment.points || 100} points
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {assignment.courseName}
                    </span>
                  </div>
                  
                  {assignment.attachmentUrl && (
                    <button
                      onClick={() => handleDownloadAttachment(assignment.attachmentUrl, assignment.attachmentName)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download Instructions
                    </button>
                  )}
                  
                  {assignment.graded && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Your Grade</p>
                          <p className="text-2xl font-bold text-green-600">
                            {assignment.grade}/{assignment.totalPoints || assignment.points}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Percentage</p>
                          <p className="text-xl font-semibold">
                            {Math.round((assignment.grade / (assignment.totalPoints || assignment.points)) * 100)}%
                          </p>
                        </div>
                      </div>
                      {assignment.feedback && (
                        <div className="mt-2 p-2 bg-white rounded">
                          <p className="text-sm text-gray-700">📝 {assignment.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {assignment.submitted ? (
                    <>
                      <button
                        onClick={() => handleViewSubmission(assignment.submission)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Submission
                      </button>
                      {assignment.submission?.fileUrl && (
                        <button
                          onClick={() => handleDownloadAttachment(assignment.submission.fileUrl, assignment.submission.fileName)}
                          className="text-sm text-gray-500 hover:text-blue-600"
                        >
                          Download My Submission
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubmitAssignment(assignment)}
                      disabled={submitting === assignment.id}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting === assignment.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Submit Assignment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;