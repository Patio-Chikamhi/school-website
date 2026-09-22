// src/components/teachers/TeacherGrades.jsx - MOBILE OPTIMIZED
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, FileText, Users, Search, Filter, Download, TrendingUp, TrendingDown,
  Edit, Eye, Plus, CheckCircle, XCircle, AlertCircle, ChevronDown, Calendar, 
  BookOpen, History, Printer, BarChart3, Clock, UserCheck, FileSpreadsheet, 
  XCircle as XIcon, Trash2, Save, AlertTriangle
} from 'lucide-react';
import { 
  collection, query, where, getDocs, doc, setDoc, updateDoc, addDoc, 
  getDoc, orderBy, deleteDoc, writeBatch 
} from 'firebase/firestore';
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
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    type: 'homework'
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchingRef = useRef(false);

  const terms = ['Term 1', 'Term 2', 'Term 3', 'Final'];
  const assignmentTypes = ['homework', 'test1', 'test2', 'quiz', 'project', 'exam'];

  const getCurrentTeacherName = () => {
    const user = auth.currentUser;
    return user?.displayName || user?.email?.split('@')[0] || teacherId || 'Teacher';
  };

  const courseIdsKey = useMemo(
    () => (teacherCourses || []).map(c => c.id).sort().join('|'),
    [teacherCourses]
  );

  useEffect(() => {
    if (selectedCourse && !fetchingRef.current) {
      fetchingRef.current = true;
      Promise.all([fetchAssignments(), fetchGrades()]).finally(() => {
        fetchingRef.current = false;
      });
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

  // ============================================
  // ASSIGNMENT CREATE / EDIT / DELETE
  // ============================================

  const openCreateModal = () => {
    setEditingAssignment(null);
    setNewAssignment({
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      type: 'homework'
    });
    setShowAssignmentModal(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title || '',
      description: assignment.description || '',
      dueDate: assignment.dueDate 
        ? new Date(assignment.dueDate).toISOString().split('T')[0] 
        : '',
      maxScore: assignment.maxScore || 100,
      type: assignment.type || 'homework'
    });
    setShowAssignmentModal(true);
  };

  const saveAssignment = async () => {
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
        updatedAt: new Date()
      };
      
      if (editingAssignment) {
        console.log(`✏️ Updating assignment ${editingAssignment.id}`);
        await updateDoc(doc(db, 'assignments', editingAssignment.id), assignmentData);
        alert('✅ Assignment updated successfully!');
      } else {
        console.log('➕ Creating new assignment');
        assignmentData.createdAt = new Date();
        assignmentData.status = 'active';
        await addDoc(collection(db, 'assignments'), assignmentData);
        alert('✅ Assignment created successfully!');
      }
      
      await fetchAssignments();
      
      setShowAssignmentModal(false);
      setEditingAssignment(null);
      setNewAssignment({ title: '', description: '', dueDate: '', maxScore: 100, type: 'homework' });
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error saving assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAssignment = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const deleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setDeleting(true);

    try {
      console.log(`🗑️ Deleting assignment: ${assignmentToDelete.id}`);
      
      const gradesQuery = query(
        collection(db, 'grades'),
        where('assignmentId', '==', assignmentToDelete.id)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      
      const deleteBatch = writeBatch(db);
      gradesSnapshot.docs.forEach(g => {
        deleteBatch.delete(doc(db, 'grades', g.id));
      });

      const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
      for (const student of enrolledStudents) {
        try {
          const summaryRef = doc(db, 'students', student.studentId, 'gradeSummary', selectedCourse);
          const summaryDoc = await getDoc(summaryRef);
          
          if (summaryDoc.exists()) {
            const summaryData = summaryDoc.data();
            if (summaryData.assignments && summaryData.assignments[assignmentToDelete.id]) {
              const updatedAssignments = { ...summaryData.assignments };
              delete updatedAssignments[assignmentToDelete.id];
              
              await setDoc(summaryRef, {
                ...summaryData,
                assignments: updatedAssignments,
                lastUpdated: new Date()
              }, { merge: false });
            }
          }
        } catch (summaryError) {
          console.warn(`Failed to update summary for ${student.studentId}:`, summaryError);
        }
      }

      deleteBatch.delete(doc(db, 'assignments', assignmentToDelete.id));
      await deleteBatch.commit();
      
      console.log(`✅ Deleted assignment + ${gradesSnapshot.size} grade records`);
      
      await fetchAssignments();
      await fetchGrades();
      
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      alert(`✅ Assignment deleted along with ${gradesSnapshot.size} grade record(s).`);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error deleting assignment: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // GRADING
  // ============================================

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
    const teacherName = getCurrentTeacherName();
    const enrolledStudents = enrolledStudentsByCourse[selectedCourse] || [];
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    const courseName = teacherCourses.find(c => c.id === selectedCourse)?.courseName || '';
    
    try {
      const gradeWrites = [];
      const summaryWrites = [];
      const auditFetches = [];

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
          courseName,
          teacherId,
          teacherName,
          assignmentId: selectedAssignment.id,
          assignmentName: selectedAssignment.title,
          assignmentType: selectedAssignment.type || 'homework',
          score: gradeValue,
          maxScore: input.maxScore,
          percentage,
          letterGrade,
          term: activeTerm,
          academicYear,
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
          auditFetches.push(
            getDoc(doc(db, 'grades', input.gradeId)).then(existingGradeDoc => {
              if (!existingGradeDoc.exists()) return null;
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
              
              return {
                type: 'update',
                ref: doc(db, 'grades', input.gradeId),
                data: {
                  ...gradeData,
                  auditTrail: [...existingAudit, auditEntry],
                  updatedAt: new Date()
                }
              };
            })
          );
        } else {
          gradeData.auditTrail = [{
            action: 'created',
            timestamp: new Date(),
            userId: teacherId,
            userName: teacherName,
            changes: null
          }];
          gradeData.createdAt = new Date();
          
          gradeWrites.push({
            type: 'create',
            collection: 'grades',
            data: gradeData
          });
        }
        
        summaryWrites.push({
          ref: doc(db, 'students', student.studentId, 'gradeSummary', selectedCourse),
          data: {
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
          }
        });
      }

      const updateOps = (await Promise.all(auditFetches)).filter(Boolean);
      const allOps = [...gradeWrites, ...updateOps];

      await Promise.all(
        allOps.map(op => {
          if (op.type === 'update') return updateDoc(op.ref, op.data);
          if (op.type === 'create') return addDoc(collection(db, op.collection), op.data);
        })
      );

      await Promise.all(
        summaryWrites.map(op => setDoc(op.ref, op.data, { merge: true }))
      );
      
      await fetchGrades();
      setGradingMode(false);
      setSelectedAssignment(null);
      alert(`✅ Grades saved successfully! (${allOps.length} records)`);
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Error saving grades: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewAuditTrail = (studentId, assignmentId) => {
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
          average: assignmentGrades.length > 0 
            ? Math.round(assignmentGrades.reduce((s, g) => s + g.percentage, 0) / assignmentGrades.length) 
            : 0,
          graded: assignmentGrades.length,
          total: enrolledStudents.length
        };
      });
      
      enrolledStudents.forEach(student => {
        const studentGrades = allGrades.filter(g => g.studentId === student.studentId);
        const average = studentGrades.length > 0 
          ? Math.round(studentGrades.reduce((s, g) => s + g.percentage, 0) / studentGrades.length) 
          : 0;
        analytics.studentPerformance.push({
          studentId: student.studentId,
          studentName: student.studentName || student.fullName,
          average,
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
    
    let csv = `Student ID,Student Name,${assignments.map(a => `"${a.title}"`).join(',')},Overall Average,Letter Grade\n`;
    
    enrolledStudents.forEach(student => {
      const row = [
        `"${student.studentId}"`,
        `"${student.studentName || student.fullName}"`
      ];
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
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-100 text-emerald-800';
    if (percentage >= 65) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 45) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const calculateTermWeek = () => {
    const startOfTerm = new Date(new Date().getFullYear(), 0, 1);
    const diffDays = Math.floor((new Date() - startOfTerm) / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(diffDays / 7), 13);
  };

  // ============================================
  // MODALS
  // ============================================

  const AuditTrailModal = ({ grade, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 lg:pb-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-140px)] lg:max-h-[80vh] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1">
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

  const GradeAnalysisModal = ({ analytics, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 lg:pb-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[calc(100vh-140px)] lg:max-h-[80vh] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Grade Analytics</h3>
            <p className="text-sm text-gray-500">{analytics?.totalStudents} Students Analyzed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{analytics?.averageScore}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Class Average</div>
            </div>
            <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl text-center">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{analytics?.highestScore}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Highest</div>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4 rounded-xl text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{analytics?.lowestScore}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Lowest</div>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-xl text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{analytics?.totalGraded}</div>
              <div className="text-xs sm:text-sm text-gray-600">Entered</div>
            </div>
          </div>

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
                      style={{ width: `${(analytics?.gradeDistribution[letter] / Math.max(analytics?.totalStudents, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Top Performers</h4>
            <div className="space-y-2">
              {analytics?.studentPerformance?.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{student.studentName}</div>
                      <div className="text-sm text-gray-500 truncate">{student.studentId}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-emerald-600">{student.average}%</div>
                    <div className="text-sm text-gray-500">Grade {student.letterGrade}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Assignment Performance</h4>
            <div className="space-y-3">
              {Object.values(analytics?.assignmentBreakdown || {}).map((assignment, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 truncate">{assignment.name}</span>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{assignment.graded}/{assignment.total}</span>
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Assigned</h3>
        <p className="text-gray-500">You haven't been assigned any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Input, manage, and review student grades</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={exportGradesToCSV}
            disabled={!selectedCourse || assignments.length === 0}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={generateGradeAnalytics}
            disabled={!selectedCourse}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>
      </div>

      {/* Course + Term Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Assignments ({activeTerm})</h3>
            <button 
              onClick={openCreateModal}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Assignment</span>
              <span className="sm:hidden">New</span>
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
                  <div key={assignment.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                    {/* ✅ Responsive flex — stacks on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{assignment.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-600">
                              <span>Due: {assignment.dueDate?.toLocaleDateString()}</span>
                              <span>Max: {assignment.maxScore || 100}</span>
                              <span className="capitalize">Type: {assignment.type || 'homework'}</span>
                              <span>Term: {assignment.term || activeTerm}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Grading Progress</div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-medium">{gradedCount}/{totalCount}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full" 
                                style={{ width: `${totalCount > 0 ? (gradedCount / totalCount) * 100 : 0}%` }} 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Avg Grade</div>
                            <span className={`inline-block font-medium px-2 py-0.5 rounded text-xs ${getGradeColor(avgGrade)}`}>
                              {avgGrade}% ({getLetterGrade(avgGrade)})
                            </span>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            {gradedCount === totalCount && totalCount > 0 ? (
                              <div className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-yellow-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">Pending ({totalCount - gradedCount})</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Distribution</div>
                            <div className="flex items-center gap-1 text-xs">
                              {['A', 'B', 'C', 'D', 'F'].map(letter => {
                                const count = assignmentGrades.filter(g => g.letterGrade === letter).length;
                                return (
                                  <span key={letter} className="text-center">
                                    <span className="font-medium">{letter}</span>
                                    <span className="ml-0.5 text-gray-500">{count}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* ✅ Actions — full width on mobile, right-side on desktop */}
                      <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
                        <button
                          onClick={() => enterGradingMode(assignment)}
                          className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 whitespace-nowrap"
                        >
                          {gradedCount > 0 ? 'Edit Grades' : 'Grade Now'}
                        </button>
                        
                        <div className="flex gap-2 flex-1 sm:flex-none">
                          <button
                            onClick={() => openEditModal(assignment)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 flex items-center justify-center gap-1"
                            title="Edit assignment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDeleteAssignment(assignment)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"
                            title="Delete assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (enrolledStudents.length > 0) {
                              viewAuditTrail(enrolledStudents[0].studentId, assignment.id);
                            }
                          }}
                          className="flex-1 sm:flex-none px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          Audit
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

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 lg:pb-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100vh-140px)] lg:max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingAssignment 
                  ? `Updating "${editingAssignment.title}" in ${activeTerm}` 
                  : 'Create an assignment to start grading'}
              </p>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {editingAssignment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <strong>Term is locked to {activeTerm}.</strong> You cannot move an assignment to a different term. 
                      To change the term, delete this assignment and create a new one in the target term.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Algebra Chapter 1 Quiz"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the assignment..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                <select
                  value={newAssignment.type}
                  onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {assignmentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setEditingAssignment(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
              >
                {loading ? (
                  'Saving...'
                ) : editingAssignment ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 lg:pb-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100vh-140px)] lg:max-h-[85vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Assignment</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold">"{assignmentToDelete.title}"</span>?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">⚠️ This will permanently delete:</p>
                <ul className="text-sm text-red-700 list-disc list-inside mt-1 space-y-1">
                  <li>The assignment itself</li>
                  <li>All grades recorded for this assignment</li>
                  <li>All grade summaries for this assignment</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssignmentToDelete(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAssignment}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    'Deleting...'
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Interface */}
      {gradingMode && selectedAssignment && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Grading: {selectedAssignment.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {activeTerm} - Max Score: {selectedAssignment.maxScore || 100}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setGradingMode(false)} 
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={saveGrades} 
                disabled={loading} 
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save All Grades'}
              </button>
            </div>
          </div>

          {/* ✅ Horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">Score</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">%</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">Grade</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">Comments</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-900">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(enrolledStudentsByCourse[selectedCourse] || []).map((student) => {
                  const input = gradeInputs[student.studentId] || {};
                  const percentage = input.grade && input.maxScore 
                    ? Math.round((input.grade / input.maxScore) * 100) 
                    : 0;
                  const key = `${selectedAssignment.id}_${student.studentId}`;
                  const hasAudit = grades[key]?.auditTrail?.length > 0;
                  
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {student.studentName?.charAt(0) || student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {student.studentName || student.fullName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxScore || 100}
                            value={input.grade || ''}
                            onChange={(e) => setGradeInputs({ 
                              ...gradeInputs, 
                              [student.studentId]: { ...input, grade: e.target.value } 
                            })}
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Score"
                          />
                          <span className="text-gray-500 text-sm">/{selectedAssignment.maxScore || 100}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getGradeColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 px-3 font-bold">{getLetterGrade(percentage)}</td>
                      <td className="py-4 px-3">
                        <input
                          type="text"
                          value={input.comments || ''}
                          onChange={(e) => setGradeInputs({ 
                            ...gradeInputs, 
                            [student.studentId]: { ...input, comments: e.target.value } 
                          })}
                          className="w-40 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Feedback"
                        />
                      </td>
                      <td className="py-4 px-3">
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

      {showAuditTrail && selectedGradeAudit && (
        <AuditTrailModal grade={selectedGradeAudit} onClose={() => setShowAuditTrail(false)} />
      )}

      {showGradeAnalysis && gradeAnalytics && (
        <GradeAnalysisModal analytics={gradeAnalytics} onClose={() => setShowGradeAnalysis(false)} />
      )}
    </div>
  );
};

export default TeacherGrades;