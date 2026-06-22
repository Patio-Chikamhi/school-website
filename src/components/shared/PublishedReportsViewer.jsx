// src/components/shared/PublishedReportsViewer.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Award, Calendar, Loader, Eye, Search, Filter, Users } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ReportViewer } from './ReportViewer';

const PublishedReportsViewer = ({ userType, userId, teacherId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterTerm, setFilterTerm] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const terms = ['all', 'Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    fetchPublishedReports();
  }, [userType, teacherId]);

  const fetchPublishedReports = async () => {
    setLoading(true);
    try {
      let reportsQuery;
      
      if (userType === 'teacher') {
        // Teacher can see all reports they published
        reportsQuery = query(
          collection(db, 'termReports'),
          where('generatedBy', '==', teacherId),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
      } else {
        // Admin can see all published reports
        reportsQuery = query(
          collection(db, 'termReports'),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(reportsQuery);
      const reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate?.() || new Date()
      }));
      
      setReports(reportsList);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterTerm !== 'all' && report.term !== filterTerm) return false;
    if (searchQuery && !report.studentName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userType === 'teacher' ? 'My Published Reports' : 'All Published Reports'}
          </h1>
          <p className="text-gray-600">View and manage published term reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-48">
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {terms.map(term => (
                <option key={term} value={term}>{term === 'all' ? 'All Terms' : term}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{reports.length}</div>
          <div className="text-sm opacity-90">Total Reports</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{new Set(reports.map(r => r.studentId)).size}</div>
          <div className="text-sm opacity-90">Students</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{new Set(reports.map(r => r.term)).size}</div>
          <div className="text-sm opacity-90">Terms</div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Published Reports</h3>
          <p className="text-gray-500">
            {userType === 'teacher' 
              ? 'You haven\'t published any term reports yet.'
              : 'No term reports have been published yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Published
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{report.studentName}</h3>
              <p className="text-sm text-gray-500">{report.term} {report.academicYear}</p>
              <p className="text-sm text-gray-500 mt-1">Average: {report.overallAverage?.toFixed(1)}% (Grade {report.overallGrade})</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Published: {report.generatedAt?.toLocaleDateString()}</span>
                <button className="text-emerald-600 hover:text-emerald-800">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal - Using ReportViewer component */}
      {showReportModal && selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => { setShowReportModal(false); setSelectedReport(null); }} 
          userType={userType} 
        />
      )}
    </div>
  );
};

export default PublishedReportsViewer;