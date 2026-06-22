// src/components/students/StudentTermReports.jsx - COMPLETELY FIXED
import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, Eye, Calendar,
  ChevronDown, ChevronUp, Award, TrendingUp,
  Loader, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { ReportViewer } from '../shared/ReportViewer';

const StudentTermReports = ({ studentId, userType = 'student', onClose, initialReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(initialReport || null);
  const [showReportModal, setShowReportModal] = useState(!!initialReport);

  useEffect(() => {
    if (!initialReport) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [studentId, initialReport]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let actualStudentId = studentId;
      
      // If studentId is a Firebase UID, get the actual student ID from users collection
      if (studentId && !studentId.startsWith('STU') && studentId.length > 20) {
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          actualStudentId = userDoc.data().studentId || userDoc.id;
        }
      }
      
      console.log('📊 Fetching reports for student ID:', actualStudentId);
      
      const reportsQuery = query(
        collection(db, 'termReports'),
        where('studentId', '==', actualStudentId),
        where('status', '==', 'published'),
        orderBy('generatedAt', 'desc')
      );
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

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  // If we have an initialReport (coming from PublishedReportsViewer), show modal directly
  if (initialReport && showReportModal) {
    return (
      <ReportViewer 
        report={initialReport} 
        onClose={() => {
          setShowReportModal(false);
          if (onClose) onClose();
        }} 
        userType={userType} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Term Reports</h1>
        <p className="text-gray-600">View your academic reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
          <p className="text-gray-500">Your term reports will appear here once published by teachers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Published</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{report.term} {report.academicYear}</h3>
              <p className="text-sm text-gray-500 mt-1">Average: {report.overallAverage?.toFixed(1)}% (Grade {report.overallGrade})</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Published: {report.generatedAt?.toLocaleDateString()}</span>
                <button className="text-emerald-600 hover:text-emerald-800">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default StudentTermReports;