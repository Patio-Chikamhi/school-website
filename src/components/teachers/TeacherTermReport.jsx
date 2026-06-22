// src/components/teachers/TeacherTermReports.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Filter, Calendar, BookOpen,
  CheckCircle, XCircle, AlertCircle, Loader,
  ChevronDown, ChevronRight, Printer, Mail,
  Plus, Trash2, Edit, Save, Eye, Users,
  Award, TrendingUp, PieChart, BarChart3,
  Settings, Sliders, Weight, ChevronLeft
} from 'lucide-react';
import { db, auth } from '../../firebase/config';
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, setDoc, addDoc, serverTimestamp,
  orderBy, limit, writeBatch
} from 'firebase/firestore';

const TeacherTermReports = ({ teacherId, teacherCourses }) => {
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [assignmentsByCourse, setAssignmentsByCourse] = useState({});
  const [selectedAssignmentsByCourse, setSelectedAssignmentsByCourse] = useState({});
  const [assessmentTypes, setAssessmentTypes] = useState({
    homework: { enabled: true, weight: 0.15, color: 'blue' },
    quiz: { enabled: true, weight: 0.15, color: 'green' },
    test1: { enabled: true, weight: 0.2, color: 'orange' },
    test2: { enabled: true, weight: 0.2, color: 'orange' },
    project: { enabled: true, weight: 0.15, color: 'purple' },
    exam: { enabled: true, weight: 0.15, color: 'red' }
  });
  const [reportConfig, setReportConfig] = useState({
    includeAttendance: true,
    includeTeacherComments: true,
    includeBehavior: true,
    includeAssignmentDetails: true,
    format: 'detailed'
  });

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = [2023, 2024, 2025, 2026, 2027];

  // Load courses data
  useEffect(() => {
    loadCoursesData();
  }, [selectedTerm]);

  const loadCoursesData = async () => {
    setLoading(true);
    try {
      const coursesWithData = [];
      const assignmentsMap = {};
      const selectedMap = {};
      
      for (const course of teacherCourses) {
        // Fetch assignments for this course
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('courseId', '==', course.id),
          where('term', '==', selectedTerm),
          orderBy('dueDate', 'asc')
        );
        const snapshot = await getDocs(assignmentsQuery);
        const assignmentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate?.() || new Date(doc.data().dueDate)
        }));
        
        assignmentsMap[course.id] = assignmentsList;
        selectedMap[course.id] = assignmentsList.map(a => a.id);
        
        // Also fetch enrolled students count
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('courseId', '==', course.id),
          where('status', '==', 'active')
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        coursesWithData.push({
          ...course,
          assignmentCount: assignmentsList.length,
          studentCount: enrollmentsSnapshot.size
        });
      }
      
      setCoursesData(coursesWithData);
      setAssignmentsByCourse(assignmentsMap);
      setSelectedAssignmentsByCourse(selectedMap);
      
      // Select all courses by default
      setSelectedCourses(coursesWithData.map(c => c.id));
      
    } catch (error) {
      console.error('Error loading courses data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students based on selected courses
  useEffect(() => {
    if (selectedCourses.length > 0) {
      fetchEnrolledStudents();
    }
  }, [selectedCourses, selectedTerm]);

  const fetchEnrolledStudents = async () => {
    setLoading(true);
    try {
      const studentMap = new Map();
      
      for (const courseId of selectedCourses) {
        const course = teacherCourses.find(c => c.id === courseId);
        if (!course) continue;
        
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('courseId', '==', courseId),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(enrollmentsQuery);
        
        snapshot.forEach(doc => {
          const enrollment = doc.data();
          if (!studentMap.has(enrollment.studentId)) {
            studentMap.set(enrollment.studentId, {
              studentId: enrollment.studentId,
              studentName: enrollment.studentName,
              courses: []
            });
          }
          studentMap.get(enrollment.studentId).courses.push({
            courseId: course.id,
            courseName: course.courseName,
            teacherName: course.teacherName
          });
        });
      }
      
      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGrades = async (studentId, courseId) => {
    try {
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId),
        where('term', '==', selectedTerm)
      );
      const snapshot = await getDocs(gradesQuery);
      
      const grades = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        grades.push({
          id: doc.id,
          name: data.assignmentName || data.title,
          type: data.assignmentType || 'assignment',
          score: data.score || data.percentage,
          maxScore: data.maxScore || 100,
          weight: data.weight || assessmentTypes[data.assignmentType]?.weight || 0.1,
          date: data.createdAt?.toDate?.() || new Date(),
          assignmentId: data.assignmentId
        });
      });
      
      return grades;
    } catch (error) {
      console.error('Error fetching grades:', error);
      return [];
    }
  };

  const fetchStudentAttendance = async (studentId, courseId) => {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId)
      );
      const snapshot = await getDocs(attendanceQuery);
      
      let present = 0;
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'present') present++;
      });
      
      return total > 0 ? (present / total) * 100 : 0;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return 0;
    }
  };

  const calculateWeightedAverage = (grades) => {
    if (grades.length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    grades.forEach(grade => {
      const weight = grade.weight || assessmentTypes[grade.type]?.weight || 0.1;
      const percentage = (grade.score / grade.maxScore) * 100;
      totalWeightedScore += percentage * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };
 /*const calculateWeightedAverage = (grades) => {
  if (grades.length === 0) return 0;
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  grades.forEach(grade => {
    // Get weight from multiple sources with fallbacks
    let weight = grade.weight;
    
    if (!weight && grade.type && assessmentTypes[grade.type]) {
      // Use assessment type weight if enabled
      weight = assessmentTypes[grade.type].enabled ? assessmentTypes[grade.type].weight : 0;
    }
    
    // Final fallback
    if (!weight || weight === 0) weight = 0.1;
    
    // Calculate percentage safely
    const maxScore = grade.maxScore || 100;
    const percentage = (grade.score / maxScore) * 100;
    
    totalWeightedScore += percentage * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
};*/
  const calculateAverageByType = (grades) => {
    const typeAverages = {};
    
    Object.keys(assessmentTypes).forEach(type => {
      if (assessmentTypes[type].enabled) {
        const typeGrades = grades.filter(g => g.type === type);
        
        if (typeGrades.length > 0) {
          const avg = typeGrades.reduce((sum, g) => 
            sum + (g.score / g.maxScore) * 100, 0) / typeGrades.length;
          typeAverages[type] = {
            average: avg,
            count: typeGrades.length,
            weight: assessmentTypes[type].weight
          };
        }
      }
    });
    
    return typeAverages;
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculateOverallAttendance = (subjects) => {
    const total = subjects.reduce((sum, s) => sum + (s.attendance || 0), 0);
    return subjects.length > 0 ? total / subjects.length : 0;
  };

  const toggleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const selectAllCourses = () => {
    setSelectedCourses(coursesData.map(c => c.id));
  };

  const deselectAllCourses = () => {
    setSelectedCourses([]);
  };

  const toggleAssignmentSelection = (courseId, assignmentId) => {
    const currentSelections = selectedAssignmentsByCourse[courseId] || [];
    if (currentSelections.includes(assignmentId)) {
      setSelectedAssignmentsByCourse({
        ...selectedAssignmentsByCourse,
        [courseId]: currentSelections.filter(id => id !== assignmentId)
      });
    } else {
      setSelectedAssignmentsByCourse({
        ...selectedAssignmentsByCourse,
        [courseId]: [...currentSelections, assignmentId]
      });
    }
  };

  const selectAllAssignmentsForCourse = (courseId) => {
    const courseAssignments = assignmentsByCourse[courseId] || [];
    setSelectedAssignmentsByCourse({
      ...selectedAssignmentsByCourse,
      [courseId]: courseAssignments.map(a => a.id)
    });
  };

  const deselectAllAssignmentsForCourse = (courseId) => {
    setSelectedAssignmentsByCourse({
      ...selectedAssignmentsByCourse,
      [courseId]: []
    });
  };

  const getTeacherName = () => {
  const user = auth.currentUser;
  return user?.displayName || user?.email?.split('@')[0] || teacherId || 'Teacher';
   };

  const generateTermReport = async (student) => {
    setGenerating(true);
    try {
      const subjectReports = [];
      let totalWeightedAverage = 0;
      let subjectCount = 0;
      
      for (const courseId of selectedCourses) {
        const course = teacherCourses.find(c => c.id === courseId);
        if (!course) continue;
        
        // Get selected assignments for this course
        const selectedAssignmentIds = selectedAssignmentsByCourse[courseId] || [];
        if (selectedAssignmentIds.length === 0) continue;
        
        // Get grades for this student in this course
        const grades = await fetchStudentGrades(student.studentId, courseId);
        
        // Filter by selected assignments
        const filteredGrades = grades.filter(g => selectedAssignmentIds.includes(g.assignmentId));
        
        // Calculate weighted average
        const finalAverage = calculateWeightedAverage(filteredGrades);
        const typeAverages = calculateAverageByType(filteredGrades);
        
        subjectReports.push({
          ...course,
          average: finalAverage,
          letterGrade: getLetterGrade(finalAverage),
          assessments: typeAverages,
          grades: filteredGrades,
          attendance: await fetchStudentAttendance(student.studentId, courseId),
          selectedAssignmentCount: selectedAssignmentIds.length,
          totalAssignmentCount: (assignmentsByCourse[courseId] || []).length
        });
        
        totalWeightedAverage += finalAverage;
        subjectCount++;
      }
      
      const overallAverage = subjectCount > 0 ? totalWeightedAverage / subjectCount : 0;
      
      const report = {
        reportId: `${selectedTerm}_${selectedYear}_${student.studentId}_${Date.now()}`,
        studentId: student.studentId,
        studentName: student.studentName,
        term: selectedTerm,
        academicYear: selectedYear,
        generatedBy: getTeacherName(),  // Change this -
        generatedById: teacherId,       // Keep UID for reference if needed
        generatedAt: new Date(),
        subjects: subjectReports,
        overallAverage: overallAverage,
        overallGrade: getLetterGrade(overallAverage),
        attendanceRate: calculateOverallAttendance(subjectReports),
        selectedCourses: selectedCourses,
        selectedAssignmentsByCourse: selectedAssignmentsByCourse,
        assessmentTypes: assessmentTypes,
        reportConfig: reportConfig,
        teacherComments: '',
        status: 'draft'
      };
      
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async (report) => {
  try {
    const currentUser = auth.currentUser;
    const teacherName = currentUser?.displayName || 
                        currentUser?.email?.split('@')[0] || 
                        teacherId || 
                        'Teacher';
    
    const reportRef = doc(db, 'termReports', report.reportId);
    const reportDoc = await getDoc(reportRef);
    
    const reportData = {
      ...report,
      generatedBy: teacherName,
      generatedById: teacherId,
      updatedAt: serverTimestamp()
    };
    
    if (reportDoc.exists()) {
      // Update existing
      await updateDoc(reportRef, reportData);
    } else {
      // Create new
      await setDoc(reportRef, {
        ...reportData,
        createdAt: serverTimestamp(),
        status: 'draft'
      });
    }
    
    alert('Report saved successfully!');
    return true;
  } catch (error) {
    console.error('Error saving report:', error);
    alert('Error saving report: ' + error.message);
    return false;
  }
};

  const publishReport = async (report) => {
  try {
    // Get the teacher's name properly
    const currentUser = auth.currentUser;
    const teacherName = currentUser?.displayName || 
                        currentUser?.email?.split('@')[0] || 
                        teacherId || 
                        'Teacher';
    
    const reportRef = doc(db, 'termReports', report.reportId);
    const reportDoc = await getDoc(reportRef);
    
    // Create the report data with generatedBy field
    const reportData = {
      ...report,
      generatedBy: teacherName,  // Add the teacher's name
      generatedById: teacherId,   // Keep the ID for reference
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    if (reportDoc.exists()) {
      // Update existing document
      await updateDoc(reportRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        teacherComments: report.teacherComments || '',
        generatedBy: teacherName  // Also update the name if changed
      });
    } else {
      // Create new document
      await setDoc(reportRef, {
        ...reportData,
        createdAt: serverTimestamp()
      });
    }
    
    alert('Report published! Students and parents can now view it.');
    return true;
  } catch (error) {
    console.error('Error publishing report:', error);
    alert('Error publishing report: ' + error.message);
    return false;
  }
};

  const generateAllReports = async () => {
    setGenerating(true);
    let successCount = 0;
    
    for (const student of students) {
      try {
        const report = await generateTermReport(student);
        await saveReport(report);
        successCount++;
      } catch (error) {
        console.error(`Error generating report for ${student.studentName}:`, error);
      }
    }
    
    alert(`Generated ${successCount} out of ${students.length} reports`);
    setGenerating(false);
  };

  const updateAssessmentTypeWeight = (type, weight) => {
    setAssessmentTypes({
      ...assessmentTypes,
      [type]: { ...assessmentTypes[type], weight: parseFloat(weight) }
    });
  };

  const toggleAssessmentType = (type) => {
    setAssessmentTypes({
      ...assessmentTypes,
      [type]: { ...assessmentTypes[type], enabled: !assessmentTypes[type].enabled }
    });
  };

  // Report Preview Modal Component
  const ReportPreviewModal = ({ report, onClose, onPublish, onSave }) => {
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [comments, setComments] = useState(report.teacherComments || '');
    
    const handlePrint = () => {
      window.print();
    };
    
    const handleSave = async () => {
      setSaving(true);
      const updatedReport = { ...report, teacherComments: comments };
      await onSave(updatedReport);
      setSaving(false);
    };
    
    const handlePublish = async () => {
      setPublishing(true);
      const updatedReport = { ...report, teacherComments: comments };
      await onPublish(updatedReport);
      setPublishing(false);
      onClose();
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Term Report Preview</h2>
              <p className="text-sm text-gray-500">
                {report.studentName} • {report.term} {report.academicYear}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-lg" title="Print">
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-8 print:p-4">
            {/* School Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Evergreen Academy</h1>
              <p className="text-gray-600">Excellence in Education</p>
              <div className="border-b-2 border-gray-300 mt-4"></div>
              <h2 className="text-2xl font-semibold mt-4">{report.term} Report</h2>
              <p className="text-gray-600">Academic Year {report.academicYear}</p>
            </div>

            {/* Student Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-sm text-gray-500">Student Name</p><p className="font-semibold">{report.studentName}</p></div>
                <div><p className="text-sm text-gray-500">Student ID</p><p className="font-semibold">{report.studentId}</p></div>
                <div><p className="text-sm text-gray-500">Term</p><p className="font-semibold">{report.term}</p></div>
                <div><p className="text-sm text-gray-500">Generated On</p><p className="font-semibold">{new Date().toLocaleDateString()}</p></div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{report.overallAverage.toFixed(1)}%</div>
                <div className="text-sm opacity-90">Overall Average</div>
                <div className="text-2xl font-bold mt-2">Grade {report.overallGrade}</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{report.attendanceRate.toFixed(1)}%</div>
                <div className="text-sm opacity-90">Attendance Rate</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{report.subjects.length}</div>
                <div className="text-sm opacity-90">Subjects Included</div>
              </div>
            </div>

            {/* Subject-wise Performance */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">Subject Performance</h3>
            <div className="space-y-6 mb-8">
              {report.subjects.map((subject, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{subject.courseName}</h4>
                      <p className="text-sm text-gray-500">Teacher: {subject.teacherName}</p>
                      <p className="text-xs text-gray-400">{subject.selectedAssignmentCount}/{subject.totalAssignmentCount} assignments selected</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{subject.average.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">Grade {subject.letterGrade}</div>
                    </div>
                  </div>

                  {/* Assessment Breakdown by Type */}
                  {Object.keys(subject.assessments).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Assessment Breakdown</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(subject.assessments).map(([type, data]) => {
                          const colors = {
                            homework: 'bg-blue-100 text-blue-800',
                            quiz: 'bg-green-100 text-green-800',
                            test1: 'bg-orange-100 text-orange-800',
                            test2: 'bg-red-100 text-red-800',
                            project: 'bg-purple-100 text-purple-800',
                            exam: 'bg-yellow-100 text-yellow-800'
                          };
                          const colorClass = colors[type] || 'bg-gray-100 text-gray-800';
                          
                          return (
                            <div key={type} className={`p-3 rounded-lg ${colorClass}`}>
                              <div className="capitalize font-semibold">{type}</div>
                              <div className="text-2xl font-bold">{data.average.toFixed(1)}%</div>
                              <div className="text-xs">({data.count} items, {(data.weight * 100).toFixed(0)}% weight)</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detailed Grades */}
                  {subject.grades.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                        View Detailed Grades ({subject.grades.length} assignments)
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="py-1 px-2 text-left">Assignment</th>
                              <th className="py-1 px-2 text-center">Type</th>
                              <th className="py-1 px-2 text-center">Score</th>
                              <th className="py-1 px-2 text-center">Max</th>
                              <th className="py-1 px-2 text-center">%</th>
                              <th className="py-1 px-2 text-left">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {subject.grades.map((grade, i) => (
                              <tr key={i}>
                                <td className="py-1 px-2">{grade.name}</td>
                                <td className="py-1 px-2 text-center capitalize">{grade.type}</td>
                                <td className="py-1 px-2 text-center">{grade.score}</td>
                                <td className="py-1 px-2 text-center">{grade.maxScore}</td>
                                <td className="py-1 px-2 text-center">{((grade.score / grade.maxScore) * 100).toFixed(1)}%</td>
                                <td className="py-1 px-2">{grade.date.toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Teacher Comments */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Teacher's Comments</h3>
              <textarea
                rows="4"
                placeholder="Add comments about the student's progress, strengths, and areas for improvement..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between text-sm text-gray-500">
                <div>Generated by: {report.generatedBy}</div>
                <div>Report ID: {report.reportId}</div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
            </button>
            <button onClick={handlePublish} disabled={publishing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
              {publishing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Publish Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Term Reports</h1>
          <p className="text-gray-600">Select courses and assignments to include in term reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowWeightConfig(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure Weights
          </button>
          <button
            onClick={generateAllReports}
            disabled={generating || students.length === 0 || selectedCourses.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate All Reports
          </button>
        </div>
      </div>

      {/* Step 1: Course Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Courses</h2>
            <p className="text-sm text-gray-500">Choose which courses to include in the term report</p>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAllCourses} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Select All</button>
            <button onClick={deselectAllCourses} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Deselect All</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coursesData.map(course => {
            const isSelected = selectedCourses.includes(course.id);
            return (
              <div key={course.id} className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} onClick={() => toggleCourseSelection(course.id)}>
                <div>
                  <div className="font-medium text-gray-900">{course.courseName}</div>
                  <div className="text-xs text-gray-500">{course.assignmentCount} assignments • {course.studentCount} students</div>
                </div>
                {isSelected ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-gray-400" />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-gray-500">Selected {selectedCourses.length} of {coursesData.length} courses</div>
      </div>

      {/* Step 2: Assignment Selection per Course */}
      {selectedCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Assignments</h2>
          {selectedCourses.map(courseId => {
            const course = teacherCourses.find(c => c.id === courseId);
            const assignments = assignmentsByCourse[courseId] || [];
            const selectedAssignments = selectedAssignmentsByCourse[courseId] || [];
            
            if (assignments.length === 0) return null;
            
            return (
              <div key={courseId} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course?.courseName}</h3>
                    <p className="text-xs text-gray-500">{assignments.length} assignments available</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => selectAllAssignmentsForCourse(courseId)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Select All</button>
                    <button onClick={() => deselectAllAssignmentsForCourse(courseId)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Deselect All</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignments.map(assignment => {
                    const isSelected = selectedAssignments.includes(assignment.id);
                    return (
                      <div key={assignment.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} onClick={() => toggleAssignmentSelection(courseId, assignment.id)}>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{assignment.title}</div>
                          <div className="text-xs text-gray-500">{assignment.type} • Due: {assignment.dueDate?.toLocaleDateString()}</div>
                        </div>
                        {isSelected ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-gray-500">Selected {selectedAssignments.length} of {assignments.length} assignments</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Term and Year Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
              {terms.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
              {years.map(year => <option key={year} value={year}>{year} - {year + 1}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Weight Configuration Modal */}
      {showWeightConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Assessment Weights</h2>
              <button onClick={() => setShowWeightConfig(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(assessmentTypes).map(([type, config]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={config.enabled} onChange={() => toggleAssessmentType(type)} className="w-4 h-4 rounded" />
                    <span className="capitalize font-medium">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="1" step="0.05" value={config.weight} onChange={(e) => updateAssessmentTypeWeight(type, e.target.value)} className="w-32" disabled={!config.enabled} />
                    <span className="text-sm w-12">{(config.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{Object.values(assessmentTypes).reduce((sum, t) => sum + (t.enabled ? t.weight : 0), 0) * 100}%</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowWeightConfig(false)} className="px-4 py-2 border rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{students.length} students enrolled in selected courses</p>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /><p className="mt-2 text-gray-600">Loading students...</p></div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No students found in selected courses</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((student) => (
              <div key={student.studentId} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                      <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                      <p className="text-xs text-gray-400">{student.courses.length} courses</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { 
                      const report = await generateTermReport(student); 
                      setSelectedStudent({ ...student, report }); 
                      setShowReportModal(true); 
                    }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Generate Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedStudent && (
        <ReportPreviewModal 
          report={selectedStudent.report} 
          onClose={() => { setShowReportModal(false); setSelectedStudent(null); }} 
          onSave={saveReport} 
          onPublish={publishReport} 
        />
      )}
    </div>
  );
};

export default TeacherTermReports;