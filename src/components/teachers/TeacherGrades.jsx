// src/components/teachers/TeacherGrades.jsx - FIXED SYNTAX
import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, Users, Search, Filter, Download, TrendingUp, TrendingDown,
  Edit, Eye, Plus, CheckCircle, XCircle, AlertCircle, ChevronDown, Calendar, 
  BookOpen, History, Printer, BarChart3, Clock, UserCheck, FileSpreadsheet, XCircle as XIcon
} from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, addDoc, getDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const TeacherGrades = ({ teacherId, teacherCourses, enrolledStudentsByCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [gradingMode, setGradingMode] = useState(false);
  const [gradeInputs, setGradeInputs] = useState({});
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [selectedGradeAudit, setSelectedGradeAudit] = useState(null);
  const [activeTerm, setActiveTerm] = useState('Term 1');
  const [showGradeAnalysis, setShowGradeAnalysis] = useState(false);
  const [gradeAnalytics, setGradeAnalytics] = useState(null);
  
  // New Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    type: 'homework'
  });

  const terms = ['Term 1', 'Term 2', 'Term 3', 'Final'];
  const assignmentTypes = ['homework', 'test1', 'test2', 'quiz', 'project', 'exam'];

  // Get current user's display name for audit trail
  const getCurrentTeacherName = () => {
    const user = auth.currentUser;
    return user?.displayName || user?.email?.split('@')[0] || teacherId || 'Teacher';
  };

  // Fetch assignments for selected course
  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments();
      fetchGrades();
    }
  }, [selectedCourse, activeTerm]);

  const fetchAssignments = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('courseId', '==', selectedCourse),
        where('teacherId', '==', teacherId),
        where('term', '==', activeTerm),
        orderBy('dueDate', 'desc')
      );
      
      const snapshot = await getDocs(assignmentsQuery);
      const assignmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate?.() || new Date(doc.data().dueDate)
      }));
      
      setAssignments(assignmentsList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    if (!selectedCourse) return;
    try {
      const gradesQuery = query(
        collection(db, 'grades'),
        where('courseId', '==', selectedCourse),
        where('teacherId', '==', teacherId),
        where('term', '==', activeTerm)
      );
      
      const snapshot = await getDocs(gradesQuery);
      const gradesMap = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.assignmentId}_${data.studentId}`;
        gradesMap[key] = {
          id: doc.id,
          ...data,
          gradedAt: data.gradedAt?.toDate?.() || new Date(data.gradedAt)
        };
      });
      
      setGrades(gradesMap);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  // Create new assignment
  const createAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) {
      alert('Please enter assignment title and due date');
      return;
    }
    
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    
    setLoading(true);
    try {
      const course = teacherCourses.find(c => c.id === selectedCourse);
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const teacherName = getCurrentTeacherName();
      
      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        courseId: selectedCourse,
        courseName: course?.courseName || 'Unknown Course',
        teacherId: teacherId,
        teacherName: teacherName,
        dueDate: new Date(newAssignment.dueDate),
        maxScore: parseInt(newAssignment.maxScore),
        type: newAssignment.type,
        term: activeTerm,
        academicYear: academicYear,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      await addDoc(collection(db, 'assignments'), assignmentData);
      await fetchAssignments();
      
      setShowAssignmentModal(false);
      setNewAssignment({ title: '', description: '', dueDate: '', maxScore: 100, type: 'homework' });
      alert('✅ Assignment created successfully!');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const enterGradingMode = (assignment) => {
    setSelectedAssignment(assignment);
    setGradingMode(true);
    
    const inputs = {};
    const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
    
    enrolledStudents.forEach(student => {
      const key = `${assignment.id}_${student.studentId}`;
      const existingGrade = grades[key];
      inputs[student.studentId] = {
        grade: existingGrade?.score || '',
        maxScore: assignment.maxScore || 100,
        comments: existingGrade?.comments || '',
        gradeId: existingGrade?.id || null
      };
    });
    
    setGradeInputs(inputs);
  };

  const saveGrades = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    const teacherName = getCurrentTeacherName();
    const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    try {
      for (const student of enrolledStudents) {
        const input = gradeInputs[student.studentId];
        if (!input || input.grade === '') continue;
        
        const gradeValue = parseFloat(input.grade);
        const percentage = Math.round((gradeValue / input.maxScore) * 100);
        const letterGrade = getLetterGrade(percentage);
        
        const gradeData = {
          studentId: student.studentId,
          studentName: student.studentName || student.fullName,
          courseId: selectedCourse,
          courseName: teacherCourses.find(c => c.id === selectedCourse)?.courseName || '',
          teacherId: teacherId,
          teacherName: teacherName,
          assignmentId: selectedAssignment.id,
          assignmentName: selectedAssignment.title,
          assignmentType: selectedAssignment.type || 'homework',
          score: gradeValue,
          maxScore: input.maxScore,
          percentage: percentage,
          letterGrade: letterGrade,
          term: activeTerm,
          academicYear: academicYear,
          dateRecorded: new Date(),
          recordedBy: teacherId,
          recordedByName: teacherName,
          comments: input.comments || '',
          metadata: {
            termWeek: calculateTermWeek(),
            assessmentWeight: selectedAssignment.weight || 0.2,
            lastUpdated: new Date()
          }
        };
        
        if (input.gradeId) {
          const existingGradeDoc = await getDoc(doc(db, 'grades', input.gradeId));
          const existingData = existingGradeDoc.data();
          
          const auditEntry = {
            action: 'updated',
            timestamp: new Date(),
            userId: teacherId,
            userName: teacherName,
            changes: {
              score: { from: existingData.score, to: gradeValue },
              percentage: { from: existingData.percentage, to: percentage },
              comments: { from: existingData.comments, to: input.comments }
            }
          };
          
          const existingAudit = existingData.auditTrail || [];
          await updateDoc(doc(db, 'grades', input.gradeId), {
            ...gradeData,
            auditTrail: [...existingAudit, auditEntry],
            updatedAt: new Date()
          });
        } else {
          gradeData.auditTrail = [{
            action: 'created',
            timestamp: new Date(),
            userId: teacherId,
            userName: teacherName,
            changes: null
          }];
          gradeData.createdAt = new Date();
          
          await addDoc(collection(db, 'grades'), gradeData);
        }
        
        await updateStudentGradeSummary(student.studentId, gradeData);
      }
      
      await fetchGrades();
      setGradingMode(false);
      setSelectedAssignment(null);
      alert('✅ Grades saved successfully!');
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Error saving grades: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentGradeSummary = async (studentId, gradeData) => {
    try {
      const studentGradeSummaryRef = doc(db, 'students', studentId, 'gradeSummary', selectedCourse);
      await setDoc(studentGradeSummaryRef, {
        courseId: selectedCourse,
        courseName: gradeData.courseName,
        assignments: {
          [gradeData.assignmentId]: {
            score: gradeData.score,
            maxScore: gradeData.maxScore,
            percentage: gradeData.percentage,
            letterGrade: gradeData.letterGrade,
            type: gradeData.assignmentType,
            dateRecorded: gradeData.dateRecorded
          }
        },
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating student grade summary:', error);
    }
  };

  const viewAuditTrail = async (studentId, assignmentId) => {
    const key = `${assignmentId}_${studentId}`;
    const grade = grades[key];
    if (grade && grade.auditTrail) {
      setSelectedGradeAudit(grade);
      setShowAuditTrail(true);
    }
  };

  const generateGradeAnalytics = async () => {
    setLoading(true);
    try {
      const allGrades = Object.values(grades);
      const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
      
      const analytics = {
        totalStudents: enrolledStudents.length,
        totalGraded: new Set(allGrades.map(g => g.studentId)).size,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        assignmentBreakdown: {},
        studentPerformance: []
      };
      
      let totalSum = 0;
      allGrades.forEach(grade => {
        totalSum += grade.percentage;
        analytics.highestScore = Math.max(analytics.highestScore, grade.percentage);
        analytics.lowestScore = Math.min(analytics.lowestScore, grade.percentage);
        analytics.gradeDistribution[grade.letterGrade]++;
      });
      analytics.averageScore = allGrades.length > 0 ? Math.round(totalSum / allGrades.length) : 0;
      
      assignments.forEach(assignment => {
        const assignmentGrades = allGrades.filter(g => g.assignmentId === assignment.id);
        analytics.assignmentBreakdown[assignment.id] = {
          name: assignment.title,
          average: assignmentGrades.length > 0 ? Math.round(assignmentGrades.reduce((s, g) => s + g.percentage, 0) / assignmentGrades.length) : 0,
          graded: assignmentGrades.length,
          total: enrolledStudents.length
        };
      });
      
      enrolledStudents.forEach(student => {
        const studentGrades = allGrades.filter(g => g.studentId === student.studentId);
        const average = studentGrades.length > 0 ? Math.round(studentGrades.reduce((s, g) => s + g.percentage, 0) / studentGrades.length) : 0;
        analytics.studentPerformance.push({
          studentId: student.studentId,
          studentName: student.studentName || student.fullName,
          average: average,
          letterGrade: getLetterGrade(average),
          assignments: studentGrades.map(g => ({
            assignmentName: g.assignmentName,
            score: g.score,
            percentage: g.percentage,
            letterGrade: g.letterGrade
          }))
        });
      });
      
      analytics.studentPerformance.sort((a, b) => b.average - a.average);
      setGradeAnalytics(analytics);
      setShowGradeAnalysis(true);
    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportGradesToCSV = () => {
    const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
    const courseName = teacherCourses.find(c => c.id === selectedCourse)?.courseName || '';
    
    let csv = `Student ID,Student Name,${assignments.map(a => a.title).join(',')},Overall Average,Letter Grade\n`;
    
    enrolledStudents.forEach(student => {
      const row = [student.studentId, student.studentName || student.fullName];
      let totalPercentage = 0;
      let gradedCount = 0;
      
      assignments.forEach(assignment => {
        const key = `${assignment.id}_${student.studentId}`;
        const grade = grades[key];
        if (grade) {
          row.push(grade.percentage);
          totalPercentage += grade.percentage;
          gradedCount++;
        } else {
          row.push('N/A');
        }
      });
      
      const average = gradedCount > 0 ? Math.round(totalPercentage / gradedCount) : 0;
      row.push(average);
      row.push(getLetterGrade(average));
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseName}_${activeTerm}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const calculateTermWeek = () => {
    const startOfTerm = new Date(new Date().getFullYear(), 0, 1);
    const diffDays = Math.floor((new Date() - startOfTerm) / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(diffDays / 7), 13);
  };

  // Audit Trail Modal
  const AuditTrailModal = ({ grade, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Audit Trail</h3>
            <p className="text-sm text-gray-500">
              {grade.studentName} - {grade.assignmentName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {grade.auditTrail?.map((entry, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{entry.action.toUpperCase()}</span>
                  <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600">By: {entry.userName}</div>
                {entry.changes && (
                  <div className="mt-2 text-sm">
                    <div className="text-gray-600">Changes:</div>
                    <ul className="list-disc list-inside ml-2">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <li key={field} className="text-xs">
                          {field}: {change.from} → {change.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Grade Analysis Modal
  const GradeAnalysisModal = ({ analytics, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Grade Analytics</h3>
            <p className="text-sm text-gray-500">{analytics?.totalStudents} Students Analyzed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics?.averageScore}%</div>
              <div className="text-sm text-gray-600">Class Average</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-emerald-600">{analytics?.highestScore}%</div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics?.lowestScore}%</div>
              <div className="text-sm text-gray-600">Lowest Score</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics?.totalGraded}</div>
              <div className="text-sm text-gray-600">Grades Entered</div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Grade Distribution</h4>
            <div className="flex gap-2">
              {['A', 'B', 'C', 'D', 'F'].map(letter => (
                <div key={letter} className="flex-1 text-center">
                  <div className="text-lg font-bold">{analytics?.gradeDistribution[letter]}</div>
                  <div className="text-sm text-gray-500">{letter}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        letter === 'A' ? 'bg-emerald-500' :
                        letter === 'B' ? 'bg-blue-500' :
                        letter === 'C' ? 'bg-yellow-500' :
                        letter === 'D' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(analytics?.gradeDistribution[letter] / analytics?.totalStudents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Top Performers</h4>
            <div className="space-y-2">
              {analytics?.studentPerformance?.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.studentName}</div>
                      <div className="text-sm text-gray-500">{student.studentId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{student.average}%</div>
                    <div className="text-sm text-gray-500">Grade {student.letterGrade}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Assignment Performance</h4>
            <div className="space-y-3">
              {Object.values(analytics?.assignmentBreakdown || {}).map((assignment, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{assignment.name}</span>
                    <span className="text-sm text-gray-500">{assignment.graded}/{assignment.total} graded</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${assignment.average}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Average: {assignment.average}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (teacherCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-gray-600 mt-1">Input, manage, and review student grades with full audit trail</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportGradesToCSV}
            disabled={!selectedCourse || assignments.length === 0}
            className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={generateGradeAnalytics}
            disabled={!selectedCourse}
            className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Course Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a course</option>
              {teacherCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseName} ({course.courseId})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Term</label>
            <select
              value={activeTerm}
              onChange={(e) => setActiveTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {terms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">Total Students</span>
                <span className="text-xl font-bold text-blue-800">
                  {enrolledStudentsByCourse[selectedCourse]?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {selectedCourse && !gradingMode && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Assignments ({activeTerm})</h3>
            <button 
              onClick={() => setShowAssignmentModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments</h3>
              <p className="text-gray-600">Click "New Assignment" to create assignments and start grading.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => {
                const assignmentGrades = Object.values(grades).filter(g => g.assignmentId === assignment.id);
                const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
                const gradedCount = assignmentGrades.length;
                const totalCount = enrolledStudents.length;
                const avgGrade = gradedCount > 0 
                  ? Math.round(assignmentGrades.reduce((sum, g) => sum + g.percentage, 0) / gradedCount)
                  : 0;
                
                return (
                  <div key={assignment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-600">Due: {assignment.dueDate?.toLocaleDateString()}</span>
                              <span className="text-sm text-gray-600">Max Score: {assignment.maxScore || 100}</span>
                              <span className="text-sm text-gray-600">Type: {assignment.type || 'homework'}</span>
                              <span className="text-sm text-gray-600">Term: {assignment.term || activeTerm}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Grading Progress</div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{gradedCount}/{totalCount}</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(gradedCount / totalCount) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Average Grade</div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span className={`font-medium ${getGradeColor(avgGrade)} px-2 py-0.5 rounded`}>
                                {avgGrade}% ({getLetterGrade(avgGrade)})
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Status</div>
                            <div className="flex items-center gap-2">
                              {gradedCount === totalCount ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-600 font-medium">Completed</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                  <span className="text-yellow-600 font-medium">Pending ({totalCount - gradedCount})</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Grade Distribution</div>
                            <div className="flex items-center gap-1">
                              {['A', 'B', 'C', 'D', 'F'].map(letter => {
                                const count = assignmentGrades.filter(g => g.letterGrade === letter).length;
                                return (
                                  <div key={letter} className="text-center">
                                    <div className="text-xs font-medium">{letter}</div>
                                    <div className="text-sm">{count}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => enterGradingMode(assignment)}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                        >
                          {gradedCount > 0 ? 'Edit Grades' : 'Grade Now'}
                        </button>
                        <button
                          onClick={() => {
                            if (enrolledStudents.length > 0) {
                              viewAuditTrail(enrolledStudents[0].studentId, assignment.id);
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          Audit Trail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Create New Assignment</h3>
              <p className="text-sm text-gray-500">Create an assignment to start grading</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Algebra Chapter 1 Quiz"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the assignment..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                  <select
                    value={newAssignment.type}
                    onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {assignmentTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
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
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createAssignment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Interface */}
      {gradingMode && selectedAssignment && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Grading: {selectedAssignment.title}</h3>
              <p className="text-gray-600 mt-1">{activeTerm} - Max Score: {selectedAssignment.maxScore || 100}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setGradingMode(false)} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveGrades} disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save All Grades'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">%</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Comments</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(enrolledStudentsByCourse[selectedCourse] || []).map((student) => {
                  const input = gradeInputs[student.studentId] || {};
                  const percentage = input.grade && input.maxScore ? Math.round((input.grade / input.maxScore) * 100) : 0;
                  const key = `${selectedAssignment.id}_${student.studentId}`;
                  const hasAudit = grades[key]?.auditTrail?.length > 0;
                  
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.studentName?.charAt(0) || student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.studentName || student.fullName}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxScore || 100}
                            value={input.grade || ''}
                            onChange={(e) => setGradeInputs({ ...gradeInputs, [student.studentId]: { ...input, grade: e.target.value } })}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Score"
                          />
                          <span className="text-gray-500">/ {selectedAssignment.maxScore || 100}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold">{getLetterGrade(percentage)}</td>
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={input.comments || ''}
                          onChange={(e) => setGradeInputs({ ...gradeInputs, [student.studentId]: { ...input, comments: e.target.value } })}
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Feedback"
                        />
                      </td>
                      <td className="py-4 px-4">
                        {hasAudit && (
                          <button
                            onClick={() => viewAuditTrail(student.studentId, selectedAssignment.id)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="View Audit Trail"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && selectedGradeAudit && (
        <AuditTrailModal grade={selectedGradeAudit} onClose={() => setShowAuditTrail(false)} />
      )}

      {/* Grade Analysis Modal */}
      {showGradeAnalysis && gradeAnalytics && (
        <GradeAnalysisModal analytics={gradeAnalytics} onClose={() => setShowGradeAnalysis(false)} />
      )}
    </div>
  );
};

export default TeacherGrades;