import React, { useState, useEffect } from 'react';
import { X, Search, User, Mail, Phone, Calendar, MapPin, GraduationCap, Award, CheckCircle, XCircle, Eye, Download, Filter, Clock, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ApplicationsModal = ({ onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const statusOptions = [
    { value: 'all', label: 'All Applications', color: 'gray' },
    { value: 'pending', label: 'Pending Review', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'emerald' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'waitlisted', label: 'Waitlisted', color: 'orange' }
  ];

  // Fetch applications from Firestore
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const applicationsRef = collection(db, 'applications');
        const q = query(applicationsRef, orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const applicationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate(),
          appliedAt: doc.data().appliedAt?.toDate()
        }));
        
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching applications:', error);
        // Fallback to mock data
        setApplications(getMockApplications());
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getMockApplications = () => {
    return [
      {
        id: '1',
        studentName: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        gradeApplying: '10',
        birthDate: '2008-05-15',
        address: '123 Main St, City, State 12345',
        status: 'pending',
        submittedAt: new Date('2024-01-10'),
        documents: { birthCertificate: 'https://example.com/birth.pdf', reportCard: 'https://example.com/report.pdf' },
        parentName: 'Jane Smith',
        parentEmail: 'jane.smith@email.com',
        parentPhone: '+1 (555) 987-6543',
        previousSchool: 'Middle School A',
        specialNeeds: 'None',
        applicationId: 'APP2024001'
      },
      {
        id: '2',
        studentName: 'Emma Johnson',
        email: 'emma.j@email.com',
        phone: '+1 (555) 234-5678',
        gradeApplying: '9',
        birthDate: '2009-08-22',
        address: '456 Oak Ave, City, State 12345',
        status: 'approved',
        submittedAt: new Date('2024-01-08'),
        documents: { birthCertificate: 'https://example.com/birth.pdf', reportCard: 'https://example.com/report.pdf' },
        parentName: 'Robert Johnson',
        parentEmail: 'robert.j@email.com',
        parentPhone: '+1 (555) 876-5432',
        previousSchool: 'Middle School B',
        specialNeeds: 'Asthma - requires inhaler access',
        applicationId: 'APP2024002'
      }
    ];
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setProcessing(true);
      
      // Update in Firestore
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin'
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, reviewedAt: new Date() }
          : app
      ));

      // If approved, create student record
      if (newStatus === 'approved') {
        const appToApprove = applications.find(app => app.id === applicationId);
        await createStudentRecord(appToApprove);
      }

      alert(`Application ${newStatus} successfully!`);
      
      // Clear selection if it's the selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    } finally {
      setProcessing(false);
    }
  };

  const createStudentRecord = async (application) => {
    try {
      // Generate student ID
      const studentId = `STU${Date.now().toString().slice(-6)}`;
      
      // Check if student already exists
      const studentQuery = query(
        collection(db, 'students'),
        where('email', '==', application.email)
      );
      const studentSnapshot = await getDocs(studentQuery);
      
      if (!studentSnapshot.empty) {
        alert('Student with this email already exists');
        return;
      }

      // Create student document
      await setDoc(doc(db, 'students', studentId), {
        id: studentId,
        studentId: studentId,
        fullName: application.studentName,
        email: application.email,
        phone: application.phone,
        grade: application.gradeApplying,
        birthDate: application.birthDate,
        address: application.address,
        parentName: application.parentName,
        parentEmail: application.parentEmail,
        parentPhone: application.parentPhone,
        status: 'active',
        enrollmentStatus: 'enrolled',
        isEnrolled: true,
        enrolledCourses: [],
        createdAt: serverTimestamp(),
        enrollmentDate: new Date().toISOString().split('T')[0],
        applicationId: application.applicationId,
        documents: application.documents
      });
      
      alert(`Student record created with ID: ${studentId}`);
    } catch (error) {
      console.error('Error creating student record:', error);
      alert('Error creating student: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waitlisted': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    waitlisted: applications.filter(a => a.status === 'waitlisted').length
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Applications</h2>
              <p className="text-gray-600">Review and process new student applications</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                  filterStatus === status.value
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{status.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  filterStatus === status.value ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {statusCounts[status.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Applications List */}
          <div className={`w-1/2 border-r border-gray-200 overflow-y-auto ${selectedApplication ? 'block' : 'w-full'}`}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">Try changing your search or filter criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredApplications.map(application => (
                  <div
                    key={application.id}
                    onClick={() => setSelectedApplication(application)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedApplication?.id === application.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{application.studentName}</h3>
                            <p className="text-sm text-gray-600">{application.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            Grade {application.gradeApplying}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {application.submittedAt?.toLocaleDateString() || application.appliedAt?.toLocaleDateString() || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status?.charAt(0)?.toUpperCase() + application.status?.slice(1) || 'Pending'}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {application.applicationId || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Details Panel */}
          {selectedApplication && (
            <div className="w-1/2 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedApplication.studentName}</h3>
                    <p className="text-sm text-gray-600">Application ID: {selectedApplication.applicationId}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status?.charAt(0)?.toUpperCase() + selectedApplication.status?.slice(1) || 'Pending'}
                  </span>
                </div>

                {/* Student Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" /> Student Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Full Name</label>
                      <p className="font-medium">{selectedApplication.studentName}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Date of Birth</label>
                      <p className="font-medium">{selectedApplication.birthDate || selectedApplication.dateOfBirth || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Email</label>
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Applying for Grade</label>
                      <p className="font-medium">{selectedApplication.gradeApplying || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Address</label>
                      <p className="font-medium">{selectedApplication.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" /> Parent/Guardian Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Parent Name</label>
                      <p className="font-medium">{selectedApplication.parentName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Relationship</label>
                      <p className="font-medium">{selectedApplication.relationship || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Parent Email</label>
                      <p className="font-medium">{selectedApplication.parentEmail || selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Parent Phone</label>
                      <p className="font-medium">{selectedApplication.parentPhone || selectedApplication.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                  <div className="space-y-3">
                    {selectedApplication.previousSchool && (
                      <div>
                        <label className="block text-xs text-gray-500">Previous School</label>
                        <p className="font-medium">{selectedApplication.previousSchool}</p>
                      </div>
                    )}
                    {selectedApplication.specialNeeds && (
                      <div>
                        <label className="block text-xs text-gray-500">Special Needs</label>
                        <p className="font-medium">{selectedApplication.specialNeeds}</p>
                      </div>
                    )}
                    {selectedApplication.notes && (
                      <div>
                        <label className="block text-xs text-gray-500">Additional Notes</label>
                        <p className="font-medium">{selectedApplication.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Application Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                      disabled={processing || selectedApplication.status === 'approved'}
                      className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                      disabled={processing || selectedApplication.status === 'rejected'}
                      className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'waitlisted')}
                      disabled={processing || selectedApplication.status === 'waitlisted'}
                      className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Waitlist
                    </button>
                    <button
                      onClick={() => window.open(selectedApplication.documents?.birthCertificate, '_blank')}
                      disabled={!selectedApplication.documents?.birthCertificate}
                      className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {/* Export functionality */}}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsModal;