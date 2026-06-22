// src/components/teachers/TeacherAssignments.jsx - UPDATED with term and academic year
import React, { useState, useEffect } from 'react';
import { 
  Plus, FileText, Calendar, Clock, Users, Award, 
  Download, Eye, Trash2, Edit, Search, Filter,
  CheckCircle, XCircle, AlertCircle, Loader,
  Upload, Link as LinkIcon, MessageSquare
} from 'lucide-react';
import { db, storage } from '../../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp, 
  orderBy, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const TeacherAssignments = ({ teacherId, teacherCourses, enrolledStudentsByCourse }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingMode, setGradingMode] = useState(false);
  const [gradeInputs, setGradeInputs] = useState({});
  const [activeTerm, setActiveTerm] = useState('Term 1');

  const terms = ['Term 1', 'Term 2', 'Term 3', 'Final'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    totalPoints: 100,
    assignmentType: 'homework',
    attachment: null,
    attachmentUrl: '',
    attachmentName: '',
    term: 'Term 1'
  });

  const assignmentTypes = [
    { value: 'homework', label: 'Homework' },
    { value: 'test1', label: 'Test 1' },
    { value: 'test2', label: 'Test 2' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'project', label: 'Project' },
    { value: 'exam', label: 'Exam' }
  ];

  useEffect(() => {
    fetchAssignments();
  }, [selectedCourse, activeTerm]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      let q = collection(db, 'assignments');
      let constraints = [orderBy('dueDate', 'asc')];
      
      constraints.unshift(where('teacherId', '==', teacherId));
      constraints.unshift(where('term', '==', activeTerm));
      
      if (selectedCourse !== 'all') {
        constraints.unshift(where('courseId', '==', selectedCourse));
      }
      
      const assignmentsQuery = query(q, ...constraints);
      const snapshot = await getDocs(assignmentsQuery);
      
      const assignmentsList = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        // Get submission count for this assignment
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', doc.id)
        );
        const submissionsSnap = await getDocs(submissionsQuery);
        
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate?.() || new Date(data.dueDate),
          createdAt: data.createdAt?.toDate?.(),
          submissionCount: submissionsSnap.size,
          gradedCount: submissionsSnap.docs.filter(s => s.data().graded).length
        };
      }));
      
      setAssignments(assignmentsList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignment.id),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(submissionsQuery);
      
      const submissionsList = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        // Get student details
        const studentQuery = query(
          collection(db, 'students'),
          where('studentId', '==', data.studentId)
        );
        const studentSnap = await getDocs(studentQuery);
        let studentName = data.studentName;
        if (!studentSnap.empty) {
          studentName = studentSnap.docs[0].data().fullName;
        }
        
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          studentName: studentName || data.studentName,
          graded: data.graded || false
        };
      }));
      
      setSubmissions(submissionsList);
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, attachment: file, attachmentName: file.name });
    }
  };

  const createAssignment = async () => {
    if (!formData.title || !formData.dueDate || !formData.assignmentType) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const course = teacherCourses.find(c => c.id === selectedCourse);
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      let attachmentUrl = '';
      
      // Upload attachment if exists
      if (formData.attachment) {
        const fileName = `assignments/${Date.now()}_${formData.attachment.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, formData.attachment);
        attachmentUrl = await getDownloadURL(storageRef);
      }
      
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        courseId: selectedCourse,
        courseName: course?.courseName,
        teacherId: teacherId,
        teacherName: course?.teacherName || 'Teacher',
        dueDate: new Date(formData.dueDate),
        totalPoints: parseInt(formData.totalPoints),
        assignmentType: formData.assignmentType,
        attachmentUrl: attachmentUrl,
        attachmentName: formData.attachmentName,
        term: activeTerm,
        academicYear: academicYear,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, 'assignments'), assignmentData);
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        totalPoints: 100,
        assignmentType: 'homework',
        attachment: null,
        attachmentUrl: '',
        attachmentName: '',
        term: 'Term 1'
      });
      fetchAssignments();
      alert('Assignment created successfully!');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId, grade, feedback) => {
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        grade: parseInt(grade),
        feedback: feedback,
        graded: true,
        gradedAt: new Date(),
        gradedBy: teacherId
      });
      
      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, grade: parseInt(grade), feedback, graded: true }
          : s
      ));
      
      // Refresh assignments list to update counts
      fetchAssignments();
      alert('Grade saved successfully!');
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Error saving grade');
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      // Delete all submissions first
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId)
      );
      const submissionsSnap = await getDocs(submissionsQuery);
      submissionsSnap.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      // Delete assignment
      await deleteDoc(doc(db, 'assignments', assignmentId));
      fetchAssignments();
      alert('Assignment deleted successfully');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error deleting assignment');
    }
  };

  const downloadAttachment = (url, name) => {
    window.open(url, '_blank');
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'test1': return 'bg-purple-100 text-purple-800';
      case 'test2': return 'bg-indigo-100 text-indigo-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'quiz': return 'bg-yellow-100 text-yellow-800';
      case 'project': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (teacherCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Assigned</h3>
        <p className="text-gray-500">You haven't been assigned any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Create assignments and grade student submissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* Term Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {terms.map(term => (
            <button
              key={term}
              onClick={() => setActiveTerm(term)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTerm === term
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Course Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCourse === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Courses
          </button>
          {teacherCourses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCourse === course.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {course.courseName}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments</h3>
          <p className="text-gray-500">Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            return (
              <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(assignment.assignmentType)}`}>
                        {assignmentTypes.find(t => t.value === assignment.assignmentType)?.label || assignment.assignmentType}
                      </span>
                      <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        {isOverdue ? 'Overdue' : 'Active'}
                      </span>
                      <span className="text-xs text-gray-400">Term: {assignment.term}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{assignment.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {assignment.dueDate.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {assignment.totalPoints} points
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {assignment.submissionCount || 0} submissions
                      </span>
                      {assignment.gradedCount > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {assignment.gradedCount} graded
                        </span>
                      )}
                    </div>
                    
                    {assignment.attachmentUrl && (
                      <button
                        onClick={() => downloadAttachment(assignment.attachmentUrl, assignment.attachmentName)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download Assignment
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchSubmissions(assignment)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                    >
                      View Submissions ({assignment.submissionCount || 0})
                    </button>
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold">Create Assignment</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Algebra Chapter 1 Quiz"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type *</label>
                  <select
                    value={formData.assignmentType}
                    onChange={(e) => setFormData({...formData, assignmentType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {assignmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={activeTerm}
                    onChange={(e) => setActiveTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {terms.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                  <input
                    type="number"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({...formData, totalPoints: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Describe what students need to do..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Detailed instructions for students..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="assignment-file"
                  />
                  <label htmlFor="assignment-file" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.attachmentName || 'Click to upload a file'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX, Images (Max 10MB)</p>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal for Grading */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedAssignment.title}</h2>
                  <p className="text-gray-600 text-sm">Grade student submissions</p>
                </div>
                <button onClick={() => setShowSubmissionsModal(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map(submission => (
                    <div key={submission.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {submission.studentName?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                              <p className="text-sm text-gray-500">
                                Submitted: {submission.submittedAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {submission.attachmentUrl && (
                            <button
                              onClick={() => window.open(submission.attachmentUrl, '_blank')}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download Submission
                            </button>
                          )}
                          
                          {submission.comments && (
                            <p className="mt-2 text-sm text-gray-600 italic">
                              "{submission.comments}"
                            </p>
                          )}
                        </div>
                        
                        <div className="w-64">
                          {submission.graded ? (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {submission.grade}/{selectedAssignment.totalPoints}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round((submission.grade / selectedAssignment.totalPoints) * 100)}%
                              </div>
                              {submission.feedback && (
                                <p className="text-sm text-gray-600 mt-2">{submission.feedback}</p>
                              )}
                              <button
                                onClick={() => {
                                  setGradingMode(true);
                                  setGradeInputs({
                                    ...gradeInputs,
                                    [submission.id]: { grade: submission.grade, feedback: submission.feedback }
                                  });
                                }}
                                className="mt-2 text-sm text-blue-600"
                              >
                                Edit Grade
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="number"
                                placeholder={`Grade (0-${selectedAssignment.totalPoints})`}
                                onChange={(e) => setGradeInputs({...gradeInputs, [submission.id]: { grade: e.target.value, feedback: gradeInputs[submission.id]?.feedback || '' }})}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                              <textarea
                                placeholder="Feedback..."
                                rows="2"
                                onChange={(e) => setGradeInputs({...gradeInputs, [submission.id]: { grade: gradeInputs[submission.id]?.grade || '', feedback: e.target.value }})}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                              <button
                                onClick={() => {
                                  const input = gradeInputs[submission.id];
                                  if (input?.grade) {
                                    gradeSubmission(submission.id, input.grade, input.feedback);
                                  } else {
                                    alert('Please enter a grade');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm"
                              >
                                Save Grade
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;