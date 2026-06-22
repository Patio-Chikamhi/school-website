// src/components/teachers/TeacherReports.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText, Users, BookOpen, Download, Eye, Calendar,
  Printer, ChevronDown, Search, Filter, Award, TrendingUp,
  CheckCircle, XCircle, Clock, Loader, Send, Mail
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TeacherReports = ({ teacherId, teacherCourses, enrolledStudentsByCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [teacherComments, setTeacherComments] = useState('');

  const terms = ['Term 1', 'Term 2', 'Term 3', 'Final'];
  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  useEffect(() => {
    if (selectedCourse && enrolledStudentsByCourse[selectedCourse]) {
      setStudents(enrolledStudentsByCourse[selectedCourse] || []);
    }
  }, [selectedCourse, enrolledStudentsByCourse]);

  useEffect(() => {
    if (selectedStudent && selectedCourse && selectedTerm) {
      fetchStudentGrades();
    }
  }, [selectedStudent, selectedCourse, selectedTerm]);

  const fetchStudentGrades = async () => {
    setLoading(true);
    try {
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', selectedStudent.studentId),
        where('courseId', '==', selectedCourse),
        where('term', '==', selectedTerm)
      );
      const snapshot = await getDocs(gradesQuery);
      const gradesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        gradedAt: doc.data().gradedAt?.toDate?.() || new Date(doc.data().gradedAt)
      }));
      setGrades(gradesData);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentAverage = () => {
    if (grades.length === 0) return { average: 0, letter: 'N/A', color: 'gray' };
    
    const totalPercentage = grades.reduce((sum, g) => sum + (g.percentage || 0), 0);
    const average = Math.round(totalPercentage / grades.length);
    
    let letter = 'F', color = 'red';
    if (average >= 90) { letter = 'A'; color = 'emerald'; }
    else if (average >= 80) { letter = 'B'; color = 'blue'; }
    else if (average >= 70) { letter = 'C'; color = 'yellow'; }
    else if (average >= 60) { letter = 'D'; color = 'orange'; }
    
    return { average, letter, color };
  };

  const getGradeDistribution = () => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    grades.forEach(grade => {
      const percentage = grade.percentage || 0;
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    });
    return distribution;
  };

  const generateReport = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert('Please select a student and course');
      return;
    }

    setGenerating(true);
    try {
      const stats = calculateStudentAverage();
      const distribution = getGradeDistribution();
      
      const reportData = {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName || selectedStudent.fullName,
        courseId: selectedCourse,
        courseName: teacherCourses.find(c => c.id === selectedCourse)?.courseName || '',
        term: selectedTerm,
        academicYear: academicYear,
        teacherId: teacherId,
        teacherName: 'Teacher',
        grades: grades.map(g => ({
          assignmentId: g.assignmentId,
          assignmentName: g.assignmentName,
          assignmentType: g.assignmentType,
          score: g.score,
          maxScore: g.maxScore,
          percentage: g.percentage,
          letterGrade: g.letterGrade,
          comments: g.comments,
          dateRecorded: g.gradedAt
        })),
        summary: {
          average: stats.average,
          letterGrade: stats.letter,
          totalAssignments: grades.length,
          completedAssignments: grades.filter(g => g.score).length,
          highestScore: Math.max(...grades.map(g => g.percentage || 0), 0),
          lowestScore: Math.min(...grades.map(g => g.percentage || 100), 100),
          gradeDistribution: distribution
        },
        teacherComments: teacherComments,
        generatedAt: new Date(),
        status: 'draft'
      };
      
      setGeneratedReport(reportData);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const saveAndPublishReport = async () => {
    if (!generatedReport) return;
    
    try {
      const reportRef = await addDoc(collection(db, 'reports'), {
        ...generatedReport,
        status: 'published',
        publishedAt: serverTimestamp(),
        publishedBy: teacherId
      });
      
      // Also save to student's subcollection
      const studentReportRef = doc(db, 'students', generatedReport.studentId, 'reports', reportRef.id);
      await updateDoc(studentReportRef, {
        ...generatedReport,
        reportId: reportRef.id
      });
      
      alert('Report published successfully!');
      setShowReportModal(false);
      setTeacherComments('');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report');
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Report - ${generatedReport?.studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .school-name { color: #059669; font-size: 24px; }
          .report-title { font-size: 18px; color: #374151; }
          .student-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .grades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .grades-table th, .grades-table td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          .grades-table th { background: #f9fafb; }
          .summary { margin: 20px 0; }
          .average { font-size: 24px; font-weight: bold; }
          .comments { margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="school-name">Evergreen Academy</h1>
          <p class="report-title">Academic Progress Report - ${generatedReport?.term} ${generatedReport?.academicYear}</p>
        </div>
        <div class="student-info">
          <p><strong>Student:</strong> ${generatedReport?.studentName}</p>
          <p><strong>Course:</strong> ${generatedReport?.courseName}</p>
          <p><strong>Teacher:</strong> ${generatedReport?.teacherName}</p>
        </div>
        <table class="grades-table">
          <thead>
            <tr><th>Assignment</th><th>Type</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Comments</th></tr>
          </thead>
          <tbody>
            ${generatedReport?.grades.map(g => `
              <tr>
                <td>${g.assignmentName}</td>
                <td>${g.assignmentType}</td>
                <td>${g.score}/${g.maxScore}</td>
                <td>${g.percentage}%</td>
                <td>${g.letterGrade}</td>
                <td>${g.comments || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>Overall Average:</strong> <span class="average">${generatedReport?.summary.average}%</span></p>
          <p><strong>Letter Grade:</strong> ${generatedReport?.summary.letterGrade}</p>
        </div>
        ${generatedReport?.teacherComments ? `
          <div class="comments">
            <h4>Teacher Comments:</h4>
            <p>${generatedReport.teacherComments}</p>
          </div>
        ` : ''}
        <p style="margin-top: 40px; text-align: center; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const stats = calculateStudentAverage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Reports</h1>
        <p className="text-gray-600 mt-1">Generate detailed academic reports for students</p>
      </div>

      {/* Selection Panel */}
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
                  {course.courseName} - {course.grade || course.gradeLevel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <select
              value={selectedStudent?.studentId || ''}
              onChange={(e) => {
                const student = students.find(s => s.studentId === e.target.value);
                setSelectedStudent(student);
              }}
              disabled={!selectedCourse}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Choose a student</option>
              {students.map(student => (
                <option key={student.studentId} value={student.studentId}>
                  {student.studentName || student.fullName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {terms.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grades Preview */}
      {selectedStudent && selectedCourse && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Grades for {selectedStudent.studentName || selectedStudent.fullName}
          </h3>

          {loading ? (
            <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>
          ) : grades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No grades recorded for this student</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.average}%</div>
                  <div className="text-sm text-gray-600">Overall Average</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.letter}</div>
                  <div className="text-sm text-gray-600">Letter Grade</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">{grades.length}</div>
                  <div className="text-sm text-gray-600">Assignments Graded</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.max(...grades.map(g => g.percentage || 0), 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Highest Score</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-3 text-left">Assignment</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-center">Score</th><th className="px-4 py-3 text-center">%</th><th className="px-4 py-3 text-center">Grade</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grades.map(grade => (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{grade.assignmentName}</td>
                        <td className="px-4 py-3 capitalize">{grade.assignmentType}</td>
                        <td className="px-4 py-3 text-center">{grade.score}/{grade.maxScore}</td>
                        <td className="px-4 py-3 text-center">{grade.percentage}%</td>
                        <td className="px-4 py-3 text-center font-bold">{grade.letterGrade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Comments</label>
                <textarea
                  value={teacherComments}
                  onChange={(e) => setTeacherComments(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add comments about student's progress..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={generateReport}
                  disabled={generating}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Generate Report
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && generatedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Student Report Card</h2>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-emerald-600">Evergreen Academy</h1>
                <p className="text-gray-500">Academic Progress Report</p>
                <p className="text-gray-500">{generatedReport.term} {generatedReport.academicYear}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-sm text-gray-500">Student Name</p><p className="font-semibold">{generatedReport.studentName}</p></div>
                  <div><p className="text-sm text-gray-500">Course</p><p className="font-semibold">{generatedReport.courseName}</p></div>
                  <div><p className="text-sm text-gray-500">Teacher</p><p className="font-semibold">{generatedReport.teacherName}</p></div>
                  <div><p className="text-sm text-gray-500">Report Date</p><p className="font-semibold">{new Date().toLocaleDateString()}</p></div>
                </div>
              </div>

              <table className="w-full mb-6 border-collapse">
                <thead className="bg-gray-100">
                  <tr><th className="p-3 text-left">Assignment</th><th className="p-3 text-left">Type</th><th className="p-3 text-center">Score</th><th className="p-3 text-center">%</th><th className="p-3 text-center">Grade</th></tr>
                </thead>
                <tbody className="divide-y">
                  {generatedReport.grades.map((g, idx) => (
                    <tr key={idx}><td className="p-3">{g.assignmentName}</td><td className="p-3 capitalize">{g.assignmentType}</td><td className="p-3 text-center">{g.score}/{g.maxScore}</td><td className="p-3 text-center">{g.percentage}%</td><td className="p-3 text-center font-bold">{g.letterGrade}</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-emerald-600">{generatedReport.summary.average}%</div><div className="text-sm text-gray-600">Overall Average</div></div>
                <div className="bg-blue-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{generatedReport.summary.letterGrade}</div><div className="text-sm text-gray-600">Letter Grade</div></div>
                <div className="bg-purple-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-purple-600">{generatedReport.summary.completedAssignments}/{generatedReport.summary.totalAssignments}</div><div className="text-sm text-gray-600">Assignments Completed</div></div>
              </div>

              {generatedReport.teacherComments && (
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-yellow-800 mb-2">Teacher's Comments</h4>
                  <p className="text-yellow-700">{generatedReport.teacherComments}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={printReport} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"><Printer className="w-4 h-4" />Print</button>
                <button onClick={saveAndPublishReport} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"><Send className="w-4 h-4" />Publish Report</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;