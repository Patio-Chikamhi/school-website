import React, { useState, useEffect, useCallback } from 'react';
import { Loader, RefreshCw, CheckCircle, XCircle, Clock, User, Mail, Calendar, FileText } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const AdminApplications = ({ applications: propApplications, refreshTrigger, onRefresh }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch applications from Firebase
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const applicationsRef = collection(db, 'applications');
      const snapshot = await getDocs(applicationsRef);
      const applicationsList = [];
      
      snapshot.forEach(doc => {
        applicationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by date (newest first)
      applicationsList.sort((a, b) => {
        return new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt);
      });
      
      setApplications(applicationsList);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load applications on component mount and when refreshTrigger changes
  useEffect(() => {

    if (propApplications && propApplications.length > 0) {
      setApplications(propApplications);
      setLoading(false);
    } else {
      // Otherwise fetch from Firebase
      fetchApplications();
    }
  }, [fetchApplications, propApplications, refreshTrigger]);

  // Handle application actions
  const handleApplicationAction = async (applicationId, action) => {
    try {
      setActionLoading(true);
      const applicationRef = doc(db, 'applications', applicationId);
      
      await updateDoc(applicationRef, {
        status: action,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: action, reviewedAt: new Date() }
          : app
      ));

      // If an application is selected, update it
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({
          ...prev,
          status: action,
          reviewedAt: new Date()
        }));
      }

      alert(`Application ${action} successfully!`);
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Failed to update application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete application
  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteDoc(doc(db, 'applications', applicationId));
      
      // Update local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
      // If deleted application was selected, clear selection
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }

      alert('Application deleted successfully!');
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-2">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
              <p className="text-gray-600 mt-1">
                Review and manage student applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh || fetchApplications}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-700 font-medium">Total Applications</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{applications.length}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium">Reviewed</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {applications.filter(app => app.status !== 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">All Applications</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {applications.length} application{applications.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="divide-y">
                {applications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No applications found.</p>
                    <p className="text-sm text-gray-400 mt-1">All applications will appear here.</p>
                  </div>
                ) : (
                  applications.map(application => (
                    <div
                      key={application.id}
                      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition ${
                        selectedApplication?.id === application.id ? 'bg-emerald-50' : ''
                      }`}
                      onClick={() => setSelectedApplication(application)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {application.name || 'No Name'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {application.email || 'No Email'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-sm text-gray-500">Course:</span>
                            <span className="text-sm font-medium ml-2">
                              {application.course || 'Not specified'}
                            </span>
                          </div>
                          
                          {application.message && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {application.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getStatusBadge(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="text-xs font-medium capitalize">
                              {application.status}
                            </span>
                          </div>
                          
                          {application.createdAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {application.createdAt.toDate 
                                ? new Date(application.createdAt.toDate()).toLocaleDateString()
                                : new Date(application.createdAt).toLocaleDateString()
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Application Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Application Details</h2>
              </div>

              {selectedApplication ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Applicant Info */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Applicant Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-medium">{selectedApplication.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email Address</p>
                          <p className="font-medium">{selectedApplication.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone Number</p>
                          <p className="font-medium">{selectedApplication.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Course Applied</p>
                          <p className="font-medium">{selectedApplication.course || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Application Message */}
                    {selectedApplication.message && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Application Message</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {selectedApplication.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Timestamps</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Applied On:</span>
                          <span className="text-sm font-medium">
                            {selectedApplication.createdAt?.toDate 
                              ? new Date(selectedApplication.createdAt.toDate()).toLocaleString()
                              : selectedApplication.createdAt 
                                ? new Date(selectedApplication.createdAt).toLocaleString()
                                : 'N/A'
                            }
                          </span>
                        </div>
                        {selectedApplication.reviewedAt && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reviewed On:</span>
                            <span className="text-sm font-medium">
                              {selectedApplication.reviewedAt.toDate 
                                ? new Date(selectedApplication.reviewedAt.toDate()).toLocaleString()
                                : new Date(selectedApplication.reviewedAt).toLocaleString()
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}
                          disabled={actionLoading || selectedApplication.status === 'approved'}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            selectedApplication.status === 'approved'
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                          }`}
                        >
                          {actionLoading ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleApplicationAction(selectedApplication.id, 'rejected')}
                          disabled={actionLoading || selectedApplication.status === 'rejected'}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            selectedApplication.status === 'rejected'
                              ? 'bg-red-100 text-red-700 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                          }`}
                        >
                          {actionLoading ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteApplication(selectedApplication.id)}
                        disabled={actionLoading}
                        className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        Delete Application
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select an application to view details</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click on any application from the list
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApplications;