import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ user, allowedRoles, children }) => {
  // If no user, redirect to appropriate login based on the route path
  if (!user) {
    const path = window.location.pathname;
    
    if (path.includes('/student')) {
      return <Navigate to="/student/login" replace />;
    }
    if (path.includes('/teacher')) {
      return <Navigate to="/teacher/login" replace />;
    }
    if (path.includes('/parent')) {
      return <Navigate to="/parent/login" replace />;
    }
    if (path.includes('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    
    // Default fallback
    return <Navigate to="/" replace />;
  }
  
  // If specific roles are required
  if (allowedRoles && allowedRoles.length > 0) {
    // Check if user's role is in the allowed roles
    const hasRequiredRole = allowedRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // User doesn't have required role - redirect to their appropriate dashboard
      switch (user.role) {
        case 'student':
          return <Navigate to="/student/dashboard" replace />;
        case 'teacher':
          return <Navigate to="/teacher/dashboard" replace />;
        case 'parent':
          return <Navigate to="/parent/dashboard" replace />;
        case 'admin':
          return <Navigate to="/dashboard" replace />;
        default:
          // Unknown role goes to homepage
          return <Navigate to="/" replace />;
      }
    }
  }
  
  // User has the right role or no role restrictions
  return children;
};

export default PrivateRoute;