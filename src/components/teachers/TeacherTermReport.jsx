// src/components/teachers/TeacherTermReports.jsx - FULLY OPTIMIZED
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

// ============================================
// ZIMSEC 5-LETTER GRADING SCALE
// ============================================
const getLetterGrade = (percentage) => {
  if (percentage >= 75) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 45) return 'D';
  return 'F';
};

const getGradeColor = (percentage) => {
  if (percentage >= 75) return 'text-emerald-600';
  if (percentage >= 65) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  if (percentage >= 45) return 'text-orange-600';
  return 'text-red-600';
};

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

  // ✅ Generation state for progress tracking
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [generationResult, setGenerationResult] = useState(null);

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = [2023, 2024, 2025, 2026, 2027];

  // ============================================
  // LOAD COURSES DATA
  // ============================================
  useEffect(() => {
    loadCoursesData();
  }, [selectedTerm]);

  const loadCoursesData = async () => {
    setLoading(true);
    try {
      const coursesWithData = [];
      const assignmentsMap = {};
      const selectedMap = {};

      // ✅ Parallel fetch — all courses at once
      const coursePromises = teacherCourses.map(async (course) => {
        const [assignmentsSnapshot, enrollmentsSnapshot] = await Promise.all([
          getDocs(query(
            collection(db, 'assignments'),
            where('courseId', '==', course.id),
            where('term', '==', selectedTerm)
          )),
          getDocs(query(
            collection(db, 'enrollments'),
            where('courseId', '==', course.id),
            where('status', '==', 'active')
          ))
        ]);

        const assignmentsList = assignmentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate?.() || new Date(data.dueDate)
          };
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        return {
          course,
          assignmentsList,
          studentCount: enrollmentsSnapshot.size
        };
      });

      const results = await Promise.all(coursePromises);

      results.forEach(({ course, assignmentsList, studentCount }) => {
        assignmentsMap[course.id] = assignmentsList;
        selectedMap[course.id] = assignmentsList.map(a => a.id);

        coursesWithData.push({
          ...course,
          assignmentCount: assignmentsList.length,
          studentCount
        });
      });

      setCoursesData(coursesWithData);
      setAssignmentsByCourse(assignmentsMap);
      setSelectedAssignmentsByCourse(selectedMap);
      setSelectedCourses(coursesWithData.map(c => c.id));

    } catch (error) {
      console.error('Error loading courses data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FETCH ENROLLED STUDENTS (BATCHED)
  // ============================================
  useEffect(() => {
    if (selectedCourses.length > 0) {
      fetchEnrolledStudents();
    } else {
      setStudents([]);
    }
  }, [selectedCourses, selectedTerm]);

  const fetchEnrolledStudents = async () => {
    setLoading(true);
    try {
      // ✅ Batched query — one per course, run in parallel
      const enrollmentPromises = selectedCourses.map(courseId =>
        getDocs(query(
          collection(db, 'enrollments'),
          where('courseId', '==', courseId),
          where('status', '==', 'active')
        )).then(snapshot => ({ courseId, snapshot }))
      );

      const results = await Promise.all(enrollmentPromises);

      const studentMap = new Map();

      results.forEach(({ courseId, snapshot }) => {
        const course = teacherCourses.find(c => c.id === courseId);
        if (!course) return;

        snapshot.forEach(doc => {
          const enrollment = doc.data();
          if (!studentMap.has(enrollment.studentId)) {
            studentMap.set(enrollment.studentId, {
              studentId: enrollment.studentId,
              studentName: enrollment.studentName || enrollment.fullName,
              courses: []
            });
          }
          studentMap.get(enrollment.studentId).courses.push({
            courseId: course.id,
            courseName: course.courseName,
            teacherName: course.teacherName
          });
        });
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FETCH STUDENT GRADES & ATTENDANCE
  // ============================================
  const fetchStudentGrades = async (studentId, courseId) => {
    try {
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId),
        where('term', '==', selectedTerm)
      );
      const snapshot = await getDocs(gradesQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.assignmentName || data.title,
          type: data.assignmentType || 'assignment',
          score: data.score || data.percentage,
          maxScore: data.maxScore || 100,
          weight: data.weight || assessmentTypes[data.assignmentType]?.weight || 0.1,
          date: data.createdAt?.toDate?.() || new Date(),
          assignmentId: data.assignmentId
        };
      });
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

  // ============================================
  // CALCULATIONS
  // ============================================
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

  const calculateOverallAttendance = (subjects) => {
    const total = subjects.reduce((sum, s) => sum + (s.attendance || 0), 0);
    return subjects.length > 0 ? total / subjects.length : 0;
  };

  // ============================================
  // SELECTION HANDLERS
  // ============================================
  const toggleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const selectAllCourses = () => setSelectedCourses(coursesData.map(c => c.id));
  const deselectAllCourses = () => setSelectedCourses([]);

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
    return user?.displayName || user?.email?.split('@')[0] || 'Teacher';
  };

  // ============================================
  // GENERATE TERM REPORT (SINGLE STUDENT)
  // ============================================
  const generateTermReport = async (student) => {
    const subjectReports = [];
    let totalWeightedAverage = 0;
    let subjectCount = 0;

    // ✅ Fetch all course data in parallel for this student
    const courseResults = await Promise.all(
      selectedCourses.map(async (courseId) => {
        const course = teacherCourses.find(c => c.id === courseId);
        if (!course) return null;

        const selectedAssignmentIds = selectedAssignmentsByCourse[courseId] || [];
        if (selectedAssignmentIds.length === 0) return null;

        const [grades, attendance] = await Promise.all([
          fetchStudentGrades(student.studentId, courseId),
          fetchStudentAttendance(student.studentId, courseId)
        ]);

        const filteredGrades = grades.filter(g => selectedAssignmentIds.includes(g.assignmentId));
        const finalAverage = calculateWeightedAverage(filteredGrades);
        const typeAverages = calculateAverageByType(filteredGrades);

        return {
          ...course,
          average: finalAverage,
          letterGrade: getLetterGrade(finalAverage),
          assessments: typeAverages,
          grades: filteredGrades,
          attendance,
          selectedAssignmentCount: selectedAssignmentIds.length,
          totalAssignmentCount: (assignmentsByCourse[courseId] || []).length
        };
      })
    );

    courseResults.forEach(subject => {
      if (subject) {
        subjectReports.push(subject);
        totalWeightedAverage += subject.average;
        subjectCount++;
      }
    });

    const overallAverage = subjectCount > 0 ? totalWeightedAverage / subjectCount : 0;

    const teacherName = getTeacherName();

    return {
      reportId: `${selectedTerm}_${selectedYear}_${student.studentId}_${Date.now()}`,
      studentId: student.studentId,
      studentName: student.studentName,
      term: selectedTerm,
      academicYear: selectedYear,
      academicYearString: `${selectedYear}-${selectedYear + 1}`,
      generatedBy: teacherName,
      generatedById: teacherId,
      generatedAt: new Date(),
      subjects: subjectReports,
      overallAverage,
      overallGrade: getLetterGrade(overallAverage),
      attendanceRate: calculateOverallAttendance(subjectReports),
      selectedCourses,
      selectedAssignmentsByCourse,
      assessmentTypes,
      reportConfig,
      teacherComments: '',
      status: 'draft'
    };
  };

  // ============================================
  // SAVE REPORT (SILENT — NO ALERT)
  // ============================================
  const saveReport = async (report) => {
    try {
      const reportRef = doc(db, 'termReports', report.reportId);
      const reportDoc = await getDoc(reportRef);

      const reportData = {
        ...report,
        updatedAt: serverTimestamp()
      };

      if (reportDoc.exists()) {
        await updateDoc(reportRef, reportData);
      } else {
        await setDoc(reportRef, {
          ...reportData,
          createdAt: serverTimestamp(),
          status: 'draft'
        });
      }

      return true; // ✅ No alert — caller handles UI
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  };

  // ============================================
  // PUBLISH REPORT
  // ============================================
  const publishReport = async (report) => {
    try {
      const teacherName = getTeacherName();
      const reportRef = doc(db, 'termReports', report.reportId);
      const reportDoc = await getDoc(reportRef);

      const reportData = {
        ...report,
        generatedBy: teacherName,
        generatedById: teacherId,
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (reportDoc.exists()) {
        await updateDoc(reportRef, {
          status: 'published',
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          teacherComments: report.teacherComments || '',
          generatedBy: teacherName
        });
      } else {
        await setDoc(reportRef, {
          ...reportData,
          createdAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error publishing report:', error);
      throw error;
    }
  };

  // ============================================
  // GENERATE ALL REPORTS (OPTIMIZED)
  // ============================================
  const generateAllReports = async () => {
    if (students.length === 0) {
      alert('No students to generate reports for');
      return;
    }

    if (selectedCourses.length === 0) {
      alert('Please select at least one course');
      return;
    }

    setGenerating(true);
    setGenerationProgress({ current: 0, total: students.length });
    setGenerationResult(null);

    const results = { success: 0, failed: 0, errors: [] };

    try {
      // ✅ Process students in parallel batches (5 at a time to avoid overwhelming)
      const batchSize = 5;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (student) => {
            try {
              const report = await generateTermReport(student);
              await saveReport(report);
              results.success++;
            } catch (error) {
              console.error(`Failed for ${student.studentName}:`, error);
              results.failed++;
              results.errors.push({
                student: student.studentName,
                error: error.message
              });
            }
          })
        );

        // Update progress after each batch
        setGenerationProgress({
          current: Math.min(i + batchSize, students.length),
          total: students.length
        });
      }

      setGenerationResult(results);

      // ✅ ONE summary alert
      if (results.failed === 0) {
        alert(`✅ Successfully generated ${results.success} report${results.success !== 1 ? 's' : ''} as drafts.\n\nGo to "All Reports" or the report list to publish them.`);
      } else {
        alert(`⚠️ Generated ${results.success} report(s), ${results.failed} failed.\n\nCheck the console for details.`);
      }

    } catch (error) {
      console.error('Fatal error in generateAllReports:', error);
      alert('Failed to generate reports: ' + error.message);
    } finally {
      setGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  // ============================================
  // WEIGHT CONFIG
  // ============================================
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

    // ============================================
  // REPORT PREVIEW MODAL — MOBILE OPTIMIZED
  // ============================================
  const ReportPreviewModal = ({ report, onClose, onPublish, onSave }) => {
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [comments, setComments] = useState(report.teacherComments || '');

    const handlePrint = () => {
      window.print();
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        const updatedReport = { ...report, teacherComments: comments };
        await onSave(updatedReport);
        alert('✅ Report saved as draft');
      } catch (error) {
        alert('Failed to save: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    const handlePublish = async () => {
      setPublishing(true);
      try {
        const updatedReport = { ...report, teacherComments: comments };
        await onPublish(updatedReport);
        alert('✅ Report published! Students and parents can now view it.');
        onClose();
      } catch (error) {
        alert('Failed to publish: ' + error.message);
      } finally {
        setPublishing(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-24 lg:pb-4">
        <div className="bg-white rounded-xl w-full max-w-5xl max-h-[calc(100vh-140px)] lg:max-h-[90vh] flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 gap-2">
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Term Report Preview</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {report.studentName} • {report.term} {report.academicYear}
              </p>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <button onClick={handlePrint} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg" title="Print">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto flex-1">
            {/* School Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Evergreen Academy</h1>
              <p className="text-gray-600 text-sm sm:text-base">Excellence in Education</p>
              <div className="border-b-2 border-gray-300 mt-3 sm:mt-4"></div>
              <h2 className="text-xl sm:text-2xl font-semibold mt-3 sm:mt-4">{report.term} Report</h2>
              <p className="text-gray-600 text-sm sm:text-base">Academic Year {report.academicYear}</p>
            </div>

            {/* Student Info */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Student Name</p>
                  <p className="font-semibold text-sm sm:text-base truncate">{report.studentName}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Student ID</p>
                  <p className="font-semibold text-sm sm:text-base truncate">{report.studentId}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Term</p>
                  <p className="font-semibold text-sm sm:text-base">{report.term}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Generated On</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-3 sm:p-4 text-white text-center">
                <div className="text-2xl sm:text-3xl font-bold">{report.overallAverage.toFixed(1)}%</div>
                <div className="text-xs sm:text-sm opacity-90">Overall Average</div>
                <div className="text-lg sm:text-2xl font-bold mt-2">Grade {report.overallGrade}</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white text-center">
                <div className="text-2xl sm:text-3xl font-bold">{report.attendanceRate.toFixed(1)}%</div>
                <div className="text-xs sm:text-sm opacity-90">Attendance Rate</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-3 sm:p-4 text-white text-center">
                <div className="text-2xl sm:text-3xl font-bold">{report.subjects.length}</div>
                <div className="text-xs sm:text-sm opacity-90">Subjects Included</div>
              </div>
            </div>

            {/* Subject-wise Performance */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Subject Performance</h3>
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              {report.subjects.map((subject, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {subject.courseName}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Teacher: {subject.teacherName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {subject.selectedAssignmentCount}/{subject.totalAssignmentCount} assignments selected
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                        {subject.average.toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Grade {subject.letterGrade}
                      </div>
                    </div>
                  </div>

                  {Object.keys(subject.assessments).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Assessment Breakdown</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
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
                            <div key={type} className={`p-2 sm:p-3 rounded-lg ${colorClass}`}>
                              <div className="capitalize font-semibold text-xs sm:text-sm">{type}</div>
                              <div className="text-lg sm:text-2xl font-bold">{data.average.toFixed(1)}%</div>
                              <div className="text-xs">
                                ({data.count} items, {(data.weight * 100).toFixed(0)}% weight)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {subject.grades.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                        View Detailed Grades ({subject.grades.length} assignments)
                      </summary>
                      <div className="mt-2 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
                        <table className="w-full text-xs min-w-[500px]">
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
                                <td className="py-1 px-2 text-center">
                                  {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                                </td>
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
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Teacher's Comments</h3>
              <textarea
                rows="4"
                placeholder="Add comments about the student's progress, strengths, and areas for improvement..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs sm:text-sm text-gray-500">
                <div>Generated by: {report.generatedBy}</div>
                <div className="truncate">Report ID: {report.reportId}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0 pb-20 lg:pb-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {publishing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Publish Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
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
            {generating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating {generationProgress.current}/{generationProgress.total}...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate All Reports ({students.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {generating && generationProgress.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Generating reports...
            </span>
            <span className="text-sm text-gray-500">
              {generationProgress.current} of {generationProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${(generationProgress.current / generationProgress.total) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Course Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Courses</h2>
            <p className="text-sm text-gray-500">Choose which courses to include in the term report</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllCourses}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={deselectAllCourses}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coursesData.map(course => {
            const isSelected = selectedCourses.includes(course.id);
            return (
              <div
                key={course.id}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => toggleCourseSelection(course.id)}
              >
                <div>
                  <div className="font-medium text-gray-900">{course.courseName}</div>
                  <div className="text-xs text-gray-500">
                    {course.assignmentCount} assignments • {course.studentCount} students
                  </div>
                </div>
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Selected {selectedCourses.length} of {coursesData.length} courses
        </div>
      </div>

      {/* Step 2: Assignment Selection per Course */}
      {selectedCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Assignments</h2>
          {selectedCourses.map(courseId => {
            const course = teacherCourses.find(c => c.id === courseId);
            const assignments = assignmentsByCourse[courseId] || [];
            const selectedAssignments = selectedAssignmentsByCourse[courseId] || [];

            if (assignments.length === 0) {
              return (
                <div key={courseId} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>{course?.courseName}:</strong> No assignments found for {selectedTerm}. 
                    Create assignments in the Gradebook first.
                  </p>
                </div>
              );
            }

            return (
              <div key={courseId} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course?.courseName}</h3>
                    <p className="text-xs text-gray-500">
                      {assignments.length} assignments available
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllAssignmentsForCourse(courseId)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => deselectAllAssignmentsForCourse(courseId)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignments.map(assignment => {
                    const isSelected = selectedAssignments.includes(assignment.id);
                    return (
                      <div
                        key={assignment.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleAssignmentSelection(courseId, assignment.id)}
                      >
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {assignment.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.type} • Due: {assignment.dueDate?.toLocaleDateString()}
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Selected {selectedAssignments.length} of {assignments.length} assignments
                </div>
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
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              {terms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              {years.map(year => (
                <option key={year} value={year}>{year} - {year + 1}</option>
              ))}
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
              <button
                onClick={() => setShowWeightConfig(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(assessmentTypes).map(([type, config]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={() => toggleAssessmentType(type)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="capitalize font-medium">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weight}
                      onChange={(e) => updateAssessmentTypeWeight(type, e.target.value)}
                      className="w-32"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm w-12">{(config.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {Object.values(assessmentTypes)
                      .reduce((sum, t) => sum + (t.enabled ? t.weight : 0), 0) * 100}
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowWeightConfig(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">
            {students.length} students enrolled in selected courses
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students found in selected courses</p>
          </div>
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
                    <button
                      onClick={async () => {
                        try {
                          const report = await generateTermReport(student);
                          setSelectedStudent({ ...student, report });
                          setShowReportModal(true);
                        } catch (error) {
                          alert('Failed to generate report: ' + error.message);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Generate Report
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
          onClose={() => {
            setShowReportModal(false);
            setSelectedStudent(null);
          }}
          onSave={saveReport}
          onPublish={publishReport}
        />
      )}
    </div>
  );
};

export default TeacherTermReports;