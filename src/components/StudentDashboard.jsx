//Student DashBoard Refactored Version
import React from 'react';


import StudentDashboard from "./students/StudentDashboard";

const StudentDashboardWrapper = ({currentUser}) => {

  return <StudentDashboard currentUser={currentUser}/> ;
}

export default StudentDashboardWrapper;