// Dashboard.jsx - Main Dashboard Component
import React from 'react';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './teachers/TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './parents/ParentDashboard';
import CSVExport from './CSVExport';

const Dashboard = ({ currentUser, students, courses, announcements, applications, applicationsLoading }) => {
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('📊 Dashboard rendering for role:', currentUser.role);
  console.log('📚 Courses received in Dashboard:', courses?.length || 0);
  console.log('👥 Students received in Dashboard:', students?.length || 0);

  // Render different dashboard based on user role
  switch (currentUser.role) {
    case 'admin':
      return (
        <AdminDashboard 
          applications={applications}
          applicationsLoading={applicationsLoading}
          students={students}
          courses={courses}
          announcements={announcements}
          currentUser={currentUser}
        />
      );
    
    case 'teacher':
      console.log('👨‍🏫 Rendering TeacherDashboard with courses:', courses?.length || 0);
      return (
        <TeacherDashboard 
          courses={courses || []}  // Ensure courses is always an array
          students={students || []}  // Ensure students is always an array
          currentUser={currentUser}
        />
      );
    
    case 'parent':
      return (
        <ParentDashboard 
          currentUser={currentUser}
        />
      );

    case 'student':
      return (
        <StudentDashboard 
          currentUser={currentUser}
          courses={courses || []}
          announcements={announcements}
        />
      );
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Your account doesn't have dashboard access.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;