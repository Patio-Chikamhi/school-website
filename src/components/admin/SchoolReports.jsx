// src/components/admin/SchoolReports.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { FileText, Users, BookOpen, Download, Eye, Calendar, Filter, Search, Printer, TrendingUp, Award, Clock, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SchoolReports = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);

  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = [2023, 2024, 2025, 2026, 2027];

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const studentsQuery = query(collection(db, 'students'), where('isActive', '==', true));
      const snapshot = await getDocs(studentsQuery);
      const classes = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.grade) classes.add(data.grade);
      });
      setAvailableClasses(Array.from(classes).sort());
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const generateReport = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setLoading(true);
    try {
      const studentsQuery = query(
        collection(db, 'students'),
        where('grade', '==', selectedClass),
        where('isActive', '==', true)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        studentId: doc.data().studentId || doc.id,
        fullName: doc.data().fullName,
        grade: doc.data().grade,
        attendanceRate: doc.data().attendanceRate || 0,
        ...doc.data()
      }));
      setStudents(studentsList);

      const allGrades = [];
      for (const student of studentsList) {
        const studentIdValue = student.studentId || student.id;
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', studentIdValue),
          where('term', '==', selectedTerm),
          where('academicYear', '==', `${selectedYear}-${selectedYear + 1}`)
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        gradesSnapshot.forEach(doc => {
          allGrades.push({
            id: doc.id,
            studentId: studentIdValue,
            studentName: student.fullName,
            ...doc.data()
          });
        });
      }

      const report = {
        className: selectedClass,
        term: selectedTerm,
        year: selectedYear,
        academicYear: `${selectedYear}-${selectedYear + 1}`,
        generatedAt: new Date(),
        students: studentsList.map(student => {
          const studentGrades = allGrades.filter(g => g.studentId === (student.studentId || student.id));
          const courses = new Map();
          
          studentGrades.forEach(grade => {
            if (!courses.has(grade.courseId)) {
              courses.set(grade.courseId, {
                courseId: grade.courseId,
                courseName: grade.courseName,
                assignments: [],
                totalScore: 0,
                totalMaxScore: 0
              });
            }
            const course = courses.get(grade.courseId);
            course.assignments.push({
              name: grade.assignmentName || grade.title,
              score: grade.score || grade.percentage,
              maxScore: grade.maxScore || 100,
              percentage: grade.percentage || ((grade.score / grade.maxScore) * 100),
              type: grade.assignmentType || 'assignment'
            });
            course.totalScore += (grade.score || grade.percentage);
            course.totalMaxScore += (grade.maxScore || 100);
          });
          
          const courseAverages = Array.from(courses.values()).map(course => ({
            courseId: course.courseId,
            courseName: course.courseName,
            assignments: course.assignments,
            finalPercentage: course.totalMaxScore > 0 ? Math.round((course.totalScore / course.totalMaxScore) * 100) : 0,
            letterGrade: getLetterGrade(course.totalMaxScore > 0 ? Math.round((course.totalScore / course.totalMaxScore) * 100) : 0)
          }));
          
          const overallAverage = courseAverages.length > 0 
            ? Math.round(courseAverages.reduce((sum, c) => sum + c.finalPercentage, 0) / courseAverages.length)
            : 0;
          
          return {
            ...student,
            courses: courseAverages,
            overallAverage,
            overallGrade: getLetterGrade(overallAverage),
            attendanceRate: student.attendanceRate || 0
          };
        }),
        classAverage: 0,
        topPerformer: null
      };

      if (report.students.length > 0) {
        report.classAverage = Math.round(report.students.reduce((sum, s) => sum + s.overallAverage, 0) / report.students.length);
        report.topPerformer = report.students.reduce((best, current) => current.overallAverage > (best?.overallAverage || 0) ? current : best, null);
      }

      setReportData(report);
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let csv = `Student ID,Student Name,${reportData.students[0]?.courses.map(c => c.courseName).join(',')},Overall Average,Overall Grade,Attendance Rate\n`;
    
    reportData.students.forEach(student => {
      const row = [student.studentId || student.id, student.fullName];
      student.courses.forEach(course => {
        row.push(`${course.finalPercentage}% (${course.letterGrade})`);
      });
      row.push(`${student.overallAverage}%`);
      row.push(student.overallGrade);
      row.push(`${student.attendanceRate || 0}%`);
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.className}_${reportData.term}_${reportData.year}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const toggleSubject = (courseId) => {
    setExpandedSubject(expandedSubject === courseId ? null : courseId);
  };

  // Student Report Modal
  const StudentReportModal = ({ student, onClose }) => {
    const [studentGrades, setStudentGrades] = useState([]);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [localExpandedSubject, setLocalExpandedSubject] = useState(null);

    useEffect(() => {
      fetchStudentGrades();
    }, [student]);

    const fetchStudentGrades = async () => {
      setLoadingGrades(true);
      try {
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentId', '==', student.studentId || student.id),
          where('term', '==', selectedTerm),
          where('academicYear', '==', `${selectedYear}-${selectedYear + 1}`)
        );
        const snapshot = await getDocs(gradesQuery);
        const grades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const courses = new Map();
        grades.forEach(grade => {
          if (!courses.has(grade.courseId)) {
            courses.set(grade.courseId, {
              courseId: grade.courseId,
              courseName: grade.courseName,
              teacherName: grade.teacherName,
              assessments: [],
              grades: []
            });
          }
          const course = courses.get(grade.courseId);
          const percentage = (grade.score / grade.maxScore) * 100;
          course.grades.push({
            name: grade.assignmentName || grade.title,
            type: grade.assignmentType,
            score: grade.score,
            maxScore: grade.maxScore,
            percentage,
            date: grade.gradedAt?.toDate?.() || new Date()
          });
          
          let assessment = course.assessments.find(a => a.type === grade.assignmentType);
          if (!assessment) {
            assessment = { type: grade.assignmentType, grades: [], count: 0, average: 0, weight: grade.weight || 0.2 };
            course.assessments.push(assessment);
          }
          assessment.grades.push(percentage);
          assessment.count++;
          assessment.average = assessment.grades.reduce((a, b) => a + b, 0) / assessment.count;
        });
        
        const subjectReports = Array.from(courses.values()).map(course => {
          let weightedSum = 0, totalWeight = 0;
          course.assessments.forEach(a => {
            weightedSum += a.average * a.weight;
            totalWeight += a.weight;
          });
          const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
          return { ...course, average, letterGrade: getLetterGrade(average) };
        });
        
        const overallAverage = subjectReports.length > 0 ? subjectReports.reduce((sum, s) => sum + s.average, 0) / subjectReports.length : 0;
        setStudentGrades({ subjects: subjectReports, overallAverage, overallGrade: getLetterGrade(overallAverage) });
      } catch (error) {
        console.error('Error fetching student grades:', error);
      } finally {
        setLoadingGrades(false);
      }
    };

    const toggleLocalSubject = (courseId) => {
      setLocalExpandedSubject(localExpandedSubject === courseId ? null : courseId);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Student Report</h2>
              <p className="text-sm text-gray-500">{student.fullName} • {selectedTerm} {selectedYear}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-6 h-6 text-gray-400" /></button>
          </div>

          <div className="p-6">
            {loadingGrades ? (
              <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-emerald-600" /></div>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-sm text-gray-500">Student Name</p><p className="font-semibold">{student.fullName}</p></div>
                    <div><p className="text-sm text-gray-500">Student ID</p><p className="font-semibold">{student.studentId || student.id}</p></div>
                    <div><p className="text-sm text-gray-500">Grade</p><p className="font-semibold">{student.grade}</p></div>
                    <div><p className="text-sm text-gray-500">Attendance</p><p className="font-semibold">{student.attendanceRate || 0}%</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white text-center">
                    <div className="text-3xl font-bold">{studentGrades.overallAverage?.toFixed(1) || 0}%</div>
                    <div className="text-sm">Overall Average</div>
                    <div className="text-2xl mt-2">Grade {studentGrades.overallGrade}</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
                    <div className="text-3xl font-bold">{studentGrades.subjects?.length || 0}</div>
                    <div className="text-sm">Subjects</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
                    <div className="text-3xl font-bold">{selectedTerm} {selectedYear}</div>
                    <div className="text-sm">Term</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Subject Performance</h3>
                {studentGrades.subjects?.map((subject, idx) => (
                  <div key={idx} className="border rounded-lg mb-4 overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100" onClick={() => toggleLocalSubject(subject.courseId)}>
                      <div><h4 className="font-semibold">{subject.courseName}</h4><p className="text-sm text-gray-500">Teacher: {subject.teacherName}</p></div>
                      <div className="text-right"><div className="text-xl font-bold text-emerald-600">{subject.average?.toFixed(1) || 0}%</div><div className="text-sm text-gray-500">Grade {subject.letterGrade}</div></div>
                      {localExpandedSubject === subject.courseId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    {localExpandedSubject === subject.courseId && (
                      <div className="p-4 border-t">
                        <h5 className="font-semibold mb-3">Assessment Breakdown</h5>
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr><th className="py-2 px-3 text-left">Type</th><th className="py-2 px-3 text-center">Count</th><th className="py-2 px-3 text-center">Average %</th><th className="py-2 px-3 text-center">Weight</th></tr>
                            </thead>
                            <tbody>
                              {subject.assessments?.map((a, i) => (
                                <tr key={i}><td className="py-2 px-3 capitalize">{a.type}</td><td className="py-2 px-3 text-center">{a.count}</td><td className="py-2 px-3 text-center">{a.average?.toFixed(1) || 0}%</td><td className="py-2 px-3 text-center">{a.weight * 100}%</td></tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr><td className="py-2 px-3 font-semibold">Weighted Average</td><td className="py-2 px-3"></td><td className="py-2 px-3"></td><td className="py-2 px-3 font-bold text-emerald-600">{subject.average?.toFixed(1) || 0}%</td></tr>
                            </tfoot>
                          </table>
                        </div>
                        <details>
                          <summary className="text-sm text-blue-600 cursor-pointer">View All Grades</summary>
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr><th className="py-1 px-2">Assignment</th><th className="py-1 px-2">Score</th><th className="py-1 px-2">%</th><th className="py-1 px-2">Date</th></tr>
                              </thead>
                              <tbody>
                                {subject.grades?.map((grade, i) => (
                                  <tr key={i}><td className="py-1 px-2">{grade.name}</td><td className="py-1 px-2">{grade.score}/{grade.maxScore}</td><td className="py-1 px-2">{((grade.score / grade.maxScore) * 100).toFixed(1)}%</td><td className="py-1 px-2">{new Date(grade.date).toLocaleDateString()}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button onClick={onClose} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">School Reports</h1><p className="text-gray-600 mt-1">Generate and view comprehensive academic reports</p></div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Class Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"><option value="">Choose a class</option>{availableClasses.map(className => (<option key={className} value={className}>Grade {className}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Academic Term</label><select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">{terms.map(term => (<option key={term} value={term}>{term}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">{years.map(year => (<option key={year} value={year}>{year}-{year + 1}</option>))}</select></div>
          <div className="flex items-end"><button onClick={generateReport} disabled={loading || !selectedClass} className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Generating...</>) : (<><FileText className="w-5 h-5" />Generate Report</>)}</button></div>
        </div>
      </div>

      {showReport && reportData && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
            <h2 className="text-2xl font-bold">Evergreen Academy</h2>
            <p className="text-blue-100 mt-1">Academic Performance Report</p>
            <div className="mt-4 flex justify-center gap-6">
              <div><div className="text-sm text-blue-200">Class</div><div className="text-xl font-semibold">Grade {reportData.className}</div></div>
              <div><div className="text-sm text-blue-200">Term</div><div className="text-xl font-semibold">{reportData.term}</div></div>
              <div><div className="text-sm text-blue-200">Academic Year</div><div className="text-xl font-semibold">{reportData.academicYear}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
            <div className="text-center"><div className="text-2xl font-bold text-gray-900">{reportData.students.length}</div><div className="text-sm text-gray-600">Total Students</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-blue-600">{reportData.classAverage}%</div><div className="text-sm text-gray-600">Class Average</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{reportData.topPerformer?.overallAverage || 0}%</div><div className="text-sm text-gray-600">Top Performer</div><div className="text-xs text-gray-500">{reportData.topPerformer?.fullName}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-purple-600">{new Date().toLocaleDateString()}</div><div className="text-sm text-gray-600">Generated On</div></div>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student Name</th>
                  {reportData.students[0]?.courses.map(course => (<th key={course.courseId} className="text-center py-3 px-4 text-sm font-semibold text-gray-900">{course.courseName}</th>))}
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Overall</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Grade</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedReport(student); setShowReportModal(true); }}>
                    <td className="py-3 px-4 text-sm text-gray-900">{student.studentId || student.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{student.fullName}</td>
                    {student.courses.map(course => (<td key={course.courseId} className="text-center py-3 px-4"><span className={`font-medium ${getGradeColor(course.finalPercentage)}`}>{course.finalPercentage}%</span><div className="text-xs text-gray-500">{course.letterGrade}</div></td>))}
                    <td className="text-center py-3 px-4"><span className={`font-bold ${getGradeColor(student.overallAverage)}`}>{student.overallAverage}%</span></td>
                    <td className="text-center py-3 px-4"><span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      student.overallGrade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                      student.overallGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                      student.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      student.overallGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>{student.overallGrade}</span></td>
                    <td className="text-center py-3 px-4"><span className="text-gray-600">{student.attendanceRate || 0}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
            <button onClick={printReport} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2"><Printer className="w-4 h-4" />Print</button>
            <button onClick={exportToCSV} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"><Download className="w-4 h-4" />Export CSV</button>
          </div>
        </div>
      )}

      {showReportModal && selectedReport && <StudentReportModal student={selectedReport} onClose={() => { setShowReportModal(false); setSelectedReport(null); }} />}
    </div>
  );
};

export default SchoolReports;