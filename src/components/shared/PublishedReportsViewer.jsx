// src/components/shared/PublishedReportsViewer.jsx - WITH CATEGORIZATION
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Award, Calendar, Loader, Eye, Search, Filter, Users, User,
  ChevronDown, ChevronRight, GraduationCap, BookOpen
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ReportViewer } from './ReportViewer';

const PublishedReportsViewer = ({ userType, userId, teacherId, studentGrade }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('grade'); // 'grade' | 'term' | 'none'
  const [expandedGroups, setExpandedGroups] = useState({});

  const terms = ['all', 'Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    fetchPublishedReports();
  }, [userType, teacherId]);

  const fetchPublishedReports = async () => {
    setLoading(true);
    try {
      let reportsQuery;

      if (userType === 'teacher') {
        // Teachers see ALL published reports
        reportsQuery = query(
          collection(db, 'termReports'),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
      } else if (userType === 'admin') {
        reportsQuery = query(
          collection(db, 'termReports'),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
      } else if (userType === 'student' || userType === 'parent') {
        reportsQuery = query(
          collection(db, 'termReports'),
          where('studentId', '==', userId),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
      }

      const snapshot = await getDocs(reportsQuery);
      const reportsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          generatedAt: data.generatedAt?.toDate?.() || new Date()
        };
      });

      // ✅ Fetch student grades for each report (to know which Form they belong to)
      const studentIds = [...new Set(reportsList.map(r => r.studentId).filter(Boolean))];
      const studentGradesMap = {};

      // Batch fetch students by studentId
      for (let i = 0; i < studentIds.length; i += 30) {
        const batch = studentIds.slice(i, i + 30);
        const studentsQuery = query(
          collection(db, 'students'),
          where('studentId', 'in', batch)
        );
        const studentsSnap = await getDocs(studentsQuery);
        studentsSnap.forEach(doc => {
          const data = doc.data();
          if (data.studentId) {
            studentGradesMap[data.studentId] = data.grade || data.gradeLevel || 'Unknown';
          }
        });
      }

      // ✅ Attach grade to each report
      const enrichedReports = reportsList.map(report => ({
        ...report,
        studentGrade: report.studentGrade || studentGradesMap[report.studentId] || 'Unknown'
      }));

      setReports(enrichedReports);

      // Auto-expand all groups by default
      const groups = {};
      enrichedReports.forEach(r => {
        const key = r.studentGrade || 'Unknown';
        groups[key] = true;
      });
      setExpandedGroups(groups);

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterTerm !== 'all' && report.term !== filterTerm) return false;

    if (filterType === 'term' && report.reportType === 'single-subject') return false;
    if (filterType === 'single' && report.reportType !== 'single-subject') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchStudent = report.studentName?.toLowerCase().includes(q);
      const matchCourse = report.courseName?.toLowerCase().includes(q);
      if (!matchStudent && !matchCourse) return false;
    }

    return true;
  });

  // ✅ Group reports based on user choice
  const groupedReports = useMemo(() => {
    if (groupBy === 'none') return { 'All Reports': filteredReports };

    const groups = {};
    filteredReports.forEach(report => {
      let key;
      if (groupBy === 'grade') {
        key = report.studentGrade || 'Unknown';
      } else if (groupBy === 'term') {
        key = `${report.term} ${report.academicYearString || report.academicYear || ''}`.trim();
      } else {
        key = 'All Reports';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    });

    // Sort groups alphabetically (with Form 1, Form 2, etc. sorted naturally)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, ''), 10);
      const bNum = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });

    const sortedGroups = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    return sortedGroups;
  }, [filteredReports, groupBy]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAll = () => {
    const all = {};
    Object.keys(groupedReports).forEach(k => { all[k] = true; });
    setExpandedGroups(all);
  };

  const collapseAll = () => {
    const all = {};
    Object.keys(groupedReports).forEach(k => { all[k] = false; });
    setExpandedGroups(all);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userType === 'teacher' ? 'Published Reports' : 'All Published Reports'}
          </h1>
          <p className="text-gray-600">
            {userType === 'teacher'
              ? 'View published reports from all teachers'
              : 'View and manage published term reports by form'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {terms.map(term => (
              <option key={term} value={term}>
                {term === 'all' ? 'All Terms' : term}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="term">Term Reports</option>
            <option value="single">Single Subject</option>
          </select>
        </div>

        {/* Group By */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-600">Group by:</span>
          {[
            { value: 'grade', label: 'Form/Class', icon: GraduationCap },
            { value: 'term', label: 'Term', icon: Calendar },
            { value: 'none', label: 'None', icon: FileText }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                groupBy === opt.value
                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <opt.icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{reports.length}</div>
          <div className="text-sm opacity-90">Total Reports</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">
            {new Set(reports.map(r => r.studentId)).size}
          </div>
          <div className="text-sm opacity-90">Students</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">
            {reports.filter(r => r.reportType === 'single-subject').length}
          </div>
          <div className="text-sm opacity-90">Single Subject</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">
            {Object.keys(groupedReports).length}
          </div>
          <div className="text-sm opacity-90">
            {groupBy === 'grade' ? 'Forms' : groupBy === 'term' ? 'Terms' : 'Groups'}
          </div>
        </div>
      </div>

      {/* Reports - Grouped */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Published Reports</h3>
          <p className="text-gray-500">
            {userType === 'teacher'
              ? 'No reports have been published yet.'
              : 'No term reports have been published yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedReports).map(([groupName, groupReports]) => {
            const isExpanded = expandedGroups[groupName];

            return (
              <div key={groupName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Group Header */}
                <div
                  className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex items-center gap-3">
                    {groupBy === 'grade' && (
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {groupName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {groupBy === 'term' && (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{groupName}</h3>
                      <p className="text-sm text-gray-500">
                        {groupReports.length} {groupReports.length === 1 ? 'report' : 'reports'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        Avg:{' '}
                        <span className="font-semibold text-emerald-600">
                          {Math.round(
                            groupReports.reduce((s, r) => s + (r.overallAverage || 0), 0) /
                              groupReports.length
                          )}
                          %
                        </span>
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Group Content */}
                {isExpanded && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer hover:border-emerald-300"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white">
                            <Award className="w-5 h-5" />
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.reportType === 'single-subject'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {report.reportType === 'single-subject' ? 'Single' : 'Term'}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {report.studentName}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {report.reportType === 'single-subject'
                            ? report.courseName
                            : `${report.subjects?.length || 0} subjects`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {report.term} •{' '}
                          {report.academicYearString || report.academicYear}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span
                              className={`text-sm font-bold ${
                                report.overallGrade === 'A'
                                  ? 'text-emerald-600'
                                  : report.overallGrade === 'B'
                                  ? 'text-blue-600'
                                  : report.overallGrade === 'C'
                                  ? 'text-yellow-600'
                                  : report.overallGrade === 'D'
                                  ? 'text-orange-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {(report.overallAverage || 0).toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({report.overallGrade})
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {report.generatedAt?.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showReportModal && selectedReport && (
        <ReportViewer
          report={selectedReport}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          userType={userType}
        />
      )}
    </div>
  );
};

export default PublishedReportsViewer;