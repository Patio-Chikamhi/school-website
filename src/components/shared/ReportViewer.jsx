// src/components/shared/ReportViewer.jsx - COMPLETELY FIXED
import React, { useState } from 'react';
import { Download, Printer, ChevronDown, ChevronUp, Eye, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export const ReportViewer = ({ report, onClose, userType = 'parent' }) => {
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const toggleSubject = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const downloadReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(getReportHTML());
    printWindow.document.close();
    printWindow.print();
  };

  const getReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.studentName} - ${report.term} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .school-name { font-size: 28px; font-weight: bold; color: #1e40af; }
          .report-title { font-size: 20px; margin-top: 10px; }
          .student-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; text-align: center; }
          .subject { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
          .subject-header { background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb; }
          .assessment-table { width: 100%; border-collapse: collapse; }
          .assessment-table th, .assessment-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .grade-A { color: #10b981; font-weight: bold; }
          .grade-B { color: #3b82f6; font-weight: bold; }
          .grade-C { color: #f59e0b; font-weight: bold; }
          .grade-D { color: #ef4444; font-weight: bold; }
          .grade-F { color: #ef4444; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">Evergreen Academy</div>
          <div class="report-title">${report.term} Academic Report - ${report.academicYear}</div>
        </div>
        <div class="student-info">
          <p><strong>Student Name:</strong> ${report.studentName}</p>
          <p><strong>Student ID:</strong> ${report.studentId}</p>
          <p><strong>Grade:</strong> ${report.grade || 'N/A'}</p>
        </div>
        <div class="summary-cards">
          <div class="card"><strong>Overall Average</strong><br>${report.overallAverage.toFixed(1)}%<br>Grade ${report.overallGrade}</div>
          <div class="card"><strong>Attendance Rate</strong><br>${report.attendanceRate.toFixed(1)}%</div>
          <div class="card"><strong>Subjects Taken</strong><br>${report.subjects?.length || 0}</div>
        </div>
        ${report.subjects?.map(subject => `
          <div class="subject">
            <div class="subject-header">
              <strong>${subject.courseName}</strong> - Teacher: ${subject.teacherName}<br>
              Final Grade: <span class="grade-${subject.letterGrade}">${subject.average.toFixed(1)}% (${subject.letterGrade})</span>
            </div>
            <table class="assessment-table">
              <thead><tr><th>Assessment</th><th>Type</th><th>Score</th><th>Max Score</th><th>Percentage</th><th>Weight</th><th>Date</th></tr></thead>
              <tbody>
                ${subject.grades?.map(g => `
                  <tr>
                    <td>${g.name}</td>
                    <td>${g.type}</td>
                    <td>${g.score}</td>
                    <td>${g.maxScore}</td>
                    <td>${((g.score / g.maxScore) * 100).toFixed(1)}%</td>
                    <td>${(g.weight * 100)}%</td>
                    <td>${new Date(g.date).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="padding: 10px; background: #f3f4f6;"><strong>Weighted Average Calculation:</strong> ${subject.assessments ? (Array.isArray(subject.assessments) ? subject.assessments.map(a => `${a.type} (${a.average.toFixed(1)}% × ${a.weight * 100}%)`).join(' + ') : Object.entries(subject.assessments).map(([type, data]) => `${type} (${data.average?.toFixed(1) || 0}% × ${(data.weight || 0.2) * 100}%)`).join(' + ')) : 'No assessments'} = ${subject.average.toFixed(1)}%</div>
          </div>
        `).join('')}
        <div class="footer"><p>Generated on: ${new Date().toLocaleDateString()}</p><p>Generated by: ${report.generatedBy || 'System'}</p><p>This is an official report of Evergreen Academy</p></div>
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Term Report</h2>
            <p className="text-sm text-gray-500">{report.studentName} • {report.term} {report.academicYear}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadReport} className="p-2 hover:bg-gray-100 rounded-lg" title="Download"><Download className="w-5 h-5 text-gray-600" /></button>
            <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded-lg" title="Print"><Printer className="w-5 h-5 text-gray-600" /></button>
            {userType === 'admin' && (
              <button onClick={() => setShowAuditTrail(!showAuditTrail)} className={`p-2 hover:bg-gray-100 rounded-lg ${showAuditTrail ? 'bg-emerald-100 text-emerald-600' : ''}`} title="Audit Trail">
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-6 h-6 text-gray-400" /></button>
          </div>
        </div>

        <div className="p-6">
          {/* School Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Evergreen Academy</h1>
            <p className="text-gray-600">Excellence in Education</p>
            <div className="border-b-2 border-gray-300 mt-4"></div>
            <h2 className="text-2xl font-semibold mt-4">{report.term} Academic Report</h2>
            <p className="text-gray-600">Academic Year {report.academicYear}</p>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><p className="text-sm text-gray-500">Student Name</p><p className="font-semibold">{report.studentName}</p></div>
              <div><p className="text-sm text-gray-500">Student ID</p><p className="font-semibold">{report.studentId}</p></div>
              <div><p className="text-sm text-gray-500">Grade</p><p className="font-semibold">{report.grade || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Generated By</p><p className="font-semibold">{report.generatedBy || 'System'}</p></div>
              <div><p className="text-sm text-gray-500">Generated On</p><p className="font-semibold">{new Date().toLocaleDateString()}</p></div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white text-center">
              <div className="text-3xl font-bold">{report.overallAverage.toFixed(1)}%</div>
              <div className="text-sm">Overall Average</div>
              <div className="text-xl mt-2">Grade {report.overallGrade}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
              <div className="text-3xl font-bold">{report.attendanceRate.toFixed(1)}%</div>
              <div className="text-sm">Attendance Rate</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
              <div className="text-3xl font-bold">{report.subjects?.length || 0}</div>
              <div className="text-sm">Subjects</div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white text-center">
              <div className="text-3xl font-bold">{report.generatedBy || 'System'}</div>
              <div className="text-sm">Generated By</div>
            </div>
          </div>

          {/* Subject Performance with Expandable Details */}
          <h3 className="text-xl font-bold mb-4">Subject Performance</h3>
          {report.subjects?.map((subject, idx) => (
            <div key={idx} className="border rounded-lg mb-4 overflow-hidden">
              <div className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100" onClick={() => toggleSubject(subject.courseId)}>
                <div><h4 className="font-semibold text-lg">{subject.courseName}</h4><p className="text-sm text-gray-500">Teacher: {subject.teacherName}</p></div>
                <div className="text-right"><div className="text-2xl font-bold text-emerald-600">{subject.average.toFixed(1)}%</div><div className="text-sm text-gray-500">Grade {subject.letterGrade}</div></div>
                {expandedSubject === subject.courseId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              {expandedSubject === subject.courseId && (
                <div className="p-4 border-t">
                  {/* Assessment Breakdown - FIXED to handle both array and object */}
                  <h5 className="font-semibold mb-3">Assessment Breakdown</h5>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-3 text-left">Type</th>
                          <th className="py-2 px-3 text-center">Count</th>
                          <th className="py-2 px-3 text-center">Average %</th>
                          <th className="py-2 px-3 text-center">Weight</th>
                          <th className="py-2 px-3 text-center">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {subject.assessments && (
                          Array.isArray(subject.assessments) 
                            ? subject.assessments.map((a, i) => (
                                <tr key={i}>
                                  <td className="py-2 px-3 capitalize">{a.type}</td>
                                  <td className="py-2 px-3 text-center">{a.count}</td>
                                  <td className="py-2 px-3 text-center">{a.average?.toFixed(1) || 0}%</td>
                                  <td className="py-2 px-3 text-center">{a.weight * 100}%</td>
                                  <td className="py-2 px-3 text-center">{(a.average * a.weight).toFixed(1)}%</td>
                                </tr>
                              ))
                            : Object.entries(subject.assessments).map(([type, data]) => (
                                <tr key={type}>
                                  <td className="py-2 px-3 capitalize">{type}</td>
                                  <td className="py-2 px-3 text-center">{data.count || 0}</td>
                                  <td className="py-2 px-3 text-center">{data.average?.toFixed(1) || 0}%</td>
                                  <td className="py-2 px-3 text-center">{(data.weight || 0.2) * 100}%</td>
                                  <td className="py-2 px-3 text-center">{((data.average || 0) * (data.weight || 0.2)).toFixed(1)}%</td>
                                </tr>
                              ))
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td className="py-2 px-3">Weighted Total</td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3 text-emerald-600">{subject.average.toFixed(1)}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Detailed Grades */}
                  {subject.grades && subject.grades.length > 0 && (
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
                                <td className="py-1 px-2">{new Date(grade.date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Teacher Comments */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Teacher's Comments</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{report.teacherComments || 'No comments provided.'}</p>
            </div>
          </div>

          {/* Audit Trail (Admin Only) */}
          {showAuditTrail && report.auditTrail && (
            <div className="mb-8 border-t pt-4">
              <h3 className="text-xl font-bold mb-2">Audit Trail</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {report.auditTrail.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm border-b border-gray-200 pb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium">{entry.action}</span> by <span className="font-medium">{entry.userName}</span>
                      <span className="text-gray-500 ml-2">{new Date(entry.timestamp).toLocaleString()}</span>
                      {entry.details && <p className="text-gray-500 text-xs mt-1">{entry.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};