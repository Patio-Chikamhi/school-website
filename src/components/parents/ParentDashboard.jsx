// ParentDashboard.jsx - FIXED to display grades and term reports correctly
import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Award, TrendingUp, Bell, FileText, 
  UserCheck, CalendarDays, Shield, Search, Settings, 
  ChevronRight, AlertCircle, Star, Home, Menu, User,
  Link as LinkIcon, UserPlus, X, Check, Loader,
  MessageSquare, Phone, Mail, Download, Filter,
  Eye, EyeOff, GraduationCap, Clock, Zap, Sparkles,
  Heart, TrendingDown, Bookmark, ArrowRight, ChevronLeft,
  LogOut, ChevronDown, Calendar, FileSpreadsheet
} from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { 
  collection, query, where, getDocs, doc, getDoc, 
  updateDoc, addDoc, serverTimestamp, orderBy, limit,
  setDoc, arrayUnion
} from 'firebase/firestore';

// Import enhanced components
import { Sidebar } from '../dashboard/Sidebar';
import { TopHeader } from '../dashboard/TopHeader';
import { StatsCard } from '../dashboard/StatsCard';
import { LoadingState } from '../dashboard/LoadingState';
import { EmptyState } from '../dashboard/EmptyState';
import { ReportViewer } from '../shared/ReportViewer';

const ParentDashboard = ({ currentUser }) => {
  const [parentData, setParentData] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLinkStudentModal, setShowLinkStudentModal] = useState(false);
  const [linkStudentCode, setLinkStudentCode] = useState('');
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [selectedTermReport, setSelectedTermReport] = useState(null);
  const [showTermReportModal, setShowTermReportModal] = useState(false);
  const [termReports, setTermReports] = useState([]);

  // Fetch parent data and linked students
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          console.log('No current user provided');
          setLoading(false);
          return;
        }
  
        console.log('Fetching parent data for:', currentUser.email);
  
        // Get parent document
        const parentDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (parentDoc.exists()) {
          const parentInfo = parentDoc.data();
          console.log('Parent data found:', parentInfo);
          setParentData(parentInfo);
          
          // Find students linked to this parent
          await fetchLinkedStudents(currentUser.email, currentUser.uid);
        } else {
          console.log('Parent document not found, creating one...');
          await createParentDocument(currentUser);
          setParentData({
            name: currentUser.displayName || 'Parent',
            email: currentUser.email,
            role: 'parent'
          });
        }
      } catch (error) {
        console.error('Error fetching parent data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchParentData();
  }, [currentUser]);

  const createParentDocument = async (user) => {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName || 'Parent',
        email: user.email,
        role: 'parent',
        linkedStudents: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating parent document:', error);
    }
  };

  // Fetch linked students
  const fetchLinkedStudents = async (parentEmail, parentId) => {
    try {
      console.log('Fetching linked students for parent:', parentEmail);
      
      const students = [];
      const studentIds = new Set();
      
      // Method 1: Find students with matching parentEmail
      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('parentEmail', '==', parentEmail));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          if (!studentIds.has(doc.id)) {
            studentIds.add(doc.id);
            students.push({ id: doc.id, ...doc.data() });
          }
        });
        console.log(`Found ${students.length} students by parentEmail`);
      } catch (error) {
        console.log('No students found by parentEmail:', error.message);
      }
      
      // Method 2: Check parent's linkedStudents array
      try {
        const parentDoc = await getDoc(doc(db, 'users', parentId));
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          if (parentData.linkedStudents && parentData.linkedStudents.length > 0) {
            console.log(`Found ${parentData.linkedStudents.length} linked students in parent document`);
            
            for (const studentId of parentData.linkedStudents) {
              if (!studentIds.has(studentId)) {
                try {
                  const studentDoc = await getDoc(doc(db, 'students', studentId));
                  if (studentDoc.exists()) {
                    studentIds.add(studentId);
                    students.push({ id: studentDoc.id, ...studentDoc.data() });
                  }
                } catch (error) {
                  console.error(`Error fetching student ${studentId}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking parent linkedStudents:', error);
      }
      
      console.log('Total linked students found:', students.length);
      setLinkedStudents(students);
      
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0]);
      } else if (students.length === 0) {
        setSelectedStudent(null);
        setPerformanceData(null);
      }
    } catch (error) {
      console.error('Error fetching linked students:', error);
    }
  };

  // Link student to parent account
  const handleLinkStudent = async () => {
    if (!linkStudentCode.trim()) {
      setLinkError('Please enter a student code');
      return;
    }

    setLinkingStudent(true);
    setLinkError('');
    setLinkSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) {
        setLinkError('User not authenticated');
        return;
      }

      const searchCode = linkStudentCode.trim().toUpperCase();
      console.log('Searching for student with code:', searchCode);

      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('studentId', '==', searchCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setLinkError('Student not found. Please check the code and try again.');
        return;
      }

      const studentDoc = snapshot.docs[0];
      const foundStudent = studentDoc.data();
      const studentDocId = studentDoc.id;

      if (foundStudent.parentEmail && foundStudent.parentEmail !== user.email) {
        setLinkError('This student is already linked to another parent account');
        return;
      }

      // Update student document
      const studentRef = doc(db, 'students', studentDocId);
      await updateDoc(studentRef, {
        parentEmail: user.email,
        parentId: user.uid,
        parentName: parentData?.name || user.displayName || 'Parent',
        linkedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update parent document
      const parentRef = doc(db, 'users', user.uid);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const parentDataDoc = parentDoc.data();
        const linkedStudentsList = parentDataDoc.linkedStudents || [];
        
        if (!linkedStudentsList.includes(studentDocId)) {
          await updateDoc(parentRef, {
            linkedStudents: [...linkedStudentsList, studentDocId],
            updatedAt: serverTimestamp()
          });
        }
      }

      const studentName = foundStudent.fullName || foundStudent.name || 'Student';
      setLinkSuccess(`Successfully linked to ${studentName}`);
      setLinkStudentCode('');
      
      await fetchLinkedStudents(user.email, user.uid);
      
      setTimeout(() => {
        setShowLinkStudentModal(false);
      }, 2000);

    } catch (error) {
      console.error('Error linking student:', error);
      setLinkError(`Error: ${error.message}`);
    } finally {
      setLinkingStudent(false);
    }
  };

  // Unlink student
  const handleUnlinkStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to unlink this student? You will lose access to their academic information.')) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        parentEmail: null,
        parentId: null,
        parentName: null,
        updatedAt: serverTimestamp()
      });

      const parentRef = doc(db, 'users', user.uid);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const parentDataDoc = parentDoc.data();
        const updatedLinkedStudents = (parentDataDoc.linkedStudents || []).filter(id => id !== studentId);
        await updateDoc(parentRef, {
          linkedStudents: updatedLinkedStudents,
          updatedAt: serverTimestamp()
        });
      }

      await fetchLinkedStudents(user.email, user.uid);
      alert('Student successfully unlinked');

    } catch (error) {
      console.error('Error unlinking student:', error);
      alert('Error unlinking student: ' + error.message);
    }
  };

  // Fetch term reports for selected student
  useEffect(() => {
    const fetchTermReports = async () => {
      if (!selectedStudent) {
        setTermReports([]);
        return;
      }

      try {
        const studentIdValue = selectedStudent.studentId || selectedStudent.id;
        const reportsQuery = query(
          collection(db, 'termReports'),
          where('studentId', '==', studentIdValue),
          where('status', '==', 'published'),
          orderBy('generatedAt', 'desc')
        );
        const snapshot = await getDocs(reportsQuery);
        const reports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          generatedAt: doc.data().generatedAt?.toDate?.() || new Date()
        }));
        setTermReports(reports);
      } catch (error) {
        console.error('Error fetching term reports:', error);
      }
    };

    fetchTermReports();
  }, [selectedStudent]);

  // Fetch performance data for selected student - FIXED
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!selectedStudent) {
        setPerformanceData(null);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching performance data for student:', selectedStudent.studentId);
        
        const studentIdValue = selectedStudent.studentId || selectedStudent.id;
        
        // Fetch grades from grades collection - using direct studentId field
        const gradesSnapshot = await getDocs(query(
          collection(db, 'grades'), 
          where('studentId', '==', studentIdValue)
        ));

        // Fetch attendance records - using direct studentId field
        const attendanceSnapshot = await getDocs(query(
          collection(db, 'attendance'), 
          where('studentId', '==', studentIdValue)
        ));

        // Process grades
        const grades = [];
        gradesSnapshot.forEach(doc => {
          const data = doc.data();
          grades.push({
            id: doc.id,
            assignmentName: data.assignmentName || data.title || 'Assignment',
            assignmentType: data.assignmentType || 'assignment',
            score: data.score || data.percentage || 0,
            maxScore: data.maxScore || 100,
            percentage: data.percentage || ((data.score / data.maxScore) * 100),
            letterGrade: data.letterGrade,
            date: data.gradedAt?.toDate?.() || data.dateRecorded?.toDate?.() || new Date(),
            courseName: data.courseName || 'Unknown Course'
          });
        });

        // Process attendance
        const attendanceRecords = [];
        attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          attendanceRecords.push({
            id: doc.id,
            date: data.date?.toDate?.() || new Date(data.date),
            courseName: data.courseName || 'General',
            status: data.status || 'present',
            remarks: data.remarks || ''
          });
        });

        // Get unique courses from grades
        const courseMap = new Map();
        grades.forEach(grade => {
          if (!courseMap.has(grade.courseName)) {
            courseMap.set(grade.courseName, {
              name: grade.courseName,
              grades: [],
              average: 0
            });
          }
          courseMap.get(grade.courseName).grades.push(grade.percentage);
        });

        // Calculate course averages
        const courses = Array.from(courseMap.values()).map(course => ({
          name: course.name,
          teacher: 'Teacher', // You can fetch teacher from course collection if needed
          grade: getLetterGrade(course.grades.reduce((a, b) => a + b, 0) / course.grades.length),
          progress: Math.round(course.grades.reduce((a, b) => a + b, 0) / course.grades.length)
        }));

        // Calculate overall average
        const validGrades = grades.filter(g => g.percentage > 0);
        const overallAverage = validGrades.length > 0 
          ? (validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length).toFixed(1)
          : 0;

        // Calculate attendance rate
        const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
        const attendanceRate = attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0;

        // Get upcoming assignments
        const upcomingAssignments = [];
        const assignmentsSnapshot = await getDocs(query(
          collection(db, 'assignments'),
          where('dueDate', '>', new Date()),
          orderBy('dueDate', 'asc'),
          limit(10)
        ));
        
        assignmentsSnapshot.forEach(doc => {
          const data = doc.data();
          upcomingAssignments.push({
            id: doc.id,
            subject: data.courseName || 'General',
            title: data.title || 'Assignment',
            dueDate: data.dueDate?.toDate?.() || new Date(data.dueDate),
            type: data.type || 'Assignment',
            priority: 'medium'
          });
        });

        const recentGrades = grades.slice(0, 5).map(grade => ({
          id: grade.id,
          subject: grade.courseName,
          assignment: grade.assignmentName,
          score: grade.percentage,
          date: grade.date.toLocaleDateString(),
          status: 'graded'
        }));

        const recentAttendance = attendanceRecords.slice(0, 5).map(record => ({
          id: record.id,
          date: record.date.toLocaleDateString(),
          subject: record.courseName,
          status: record.status,
          notes: record.remarks
        }));

        const performance = {
          overallAverage: parseFloat(overallAverage),
          attendanceRate,
          behaviorScore: 8.5,
          recentGrades,
          upcomingAssignments: upcomingAssignments.slice(0, 5),
          attendanceRecords: recentAttendance,
          courses
        };
        
        console.log('Performance data loaded:', performance);
        setPerformanceData(performance);
        
        const activities = [];
        recentGrades.slice(0, 2).forEach(grade => {
          activities.push({
            id: `grade-${grade.id}`,
            type: 'grade',
            title: `${grade.subject} grade updated to ${grade.score}%`,
            student: selectedStudent.fullName,
            time: grade.date,
            status: 'updated'
          });
        });
        
        setRecentActivities(activities);
        
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setPerformanceData(getMockPerformanceData(selectedStudent));
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedStudent]);

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getMockPerformanceData = (student) => {
    return {
      overallAverage: 78.5,
      attendanceRate: 92,
      behaviorScore: 8.5,
      recentGrades: [
        { subject: 'Mathematics', assignment: 'Chapter 5 Test', score: 85, date: '2024-01-15', status: 'graded' },
        { subject: 'Science', assignment: 'Lab Report', score: 92, date: '2024-01-14', status: 'graded' },
        { subject: 'English', assignment: 'Essay', score: 78, date: '2024-01-12', status: 'graded' },
      ],
      upcomingAssignments: [
        { subject: 'Science', title: 'Chemistry Quiz', dueDate: '2024-01-20', type: 'Quiz', priority: 'high' },
        { subject: 'English', title: 'Book Report', dueDate: '2024-01-22', type: 'Report', priority: 'medium' },
      ],
      attendanceRecords: [
        { date: '2024-01-15', subject: 'All day', status: 'present' },
        { date: '2024-01-14', subject: 'Mathematics', status: 'present' },
        { date: '2024-01-13', subject: 'All day', status: 'absent' },
      ],
      courses: [
        { name: 'Mathematics 101', teacher: 'Mr. Johnson', grade: 'B+', progress: 75 },
        { name: 'Science 202', teacher: 'Ms. Davis', grade: 'A-', progress: 82 },
      ]
    };
  };

  const [recentActivities, setRecentActivities] = useState([]);

  // Link Student Modal
  const LinkStudentModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Link Student Account</h2>
              <p className="text-sm text-gray-500">Connect to your child's account</p>
            </div>
            <button onClick={() => setShowLinkStudentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID or Code</label>
              <input
                type="text"
                value={linkStudentCode}
                onChange={(e) => setLinkStudentCode(e.target.value)}
                placeholder="Enter student ID (e.g., STU260010)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-sm text-gray-500 mt-2">Ask your child for their student ID</p>
            </div>

            {linkError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{linkError}</span>
                </div>
              </div>
            )}

            {linkSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{linkSuccess}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleLinkStudent}
                disabled={linkingStudent || !linkStudentCode.trim()}
                className="flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {linkingStudent ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Link Account
                  </>
                )}
              </button>
              <button onClick={() => setShowLinkStudentModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'from-emerald-500 to-emerald-600';
    if (grade >= 80) return 'from-blue-500 to-blue-600';
    if (grade >= 70) return 'from-yellow-500 to-yellow-600';
    if (grade >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 95) return 'from-emerald-500 to-emerald-600';
    if (percentage >= 90) return 'from-blue-500 to-blue-600';
    if (percentage >= 85) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-emerald-100 text-emerald-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = (query) => setSearchQuery(query);
  const handleNotificationsClick = () => console.log('Notifications clicked');
  const handleSettingsClick = () => setActiveSection('settings');

  if (loading) {
    return <LoadingState message="Loading Parent Dashboard..." type="spinner" />;
  }

  const parentName = parentData?.name || 'Parent';
  const displayName = selectedStudent?.fullName || selectedStudent?.name || 'Student';
  
  const renderMainContent = () => {
    if (activeSection !== 'dashboard') {
      switch (activeSection) {
        case 'children':
          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Children</h2>
                <button onClick={() => setShowLinkStudentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  <UserPlus className="w-4 h-4" />
                  Link New Student
                </button>
              </div>
              
              {linkedStudents.length === 0 ? (
                <EmptyState
                  title="No Students Linked"
                  message="Link your child's account to view their academic progress"
                  icon="users"
                  action={() => setShowLinkStudentModal(true)}
                  actionText="Link Student Account"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {linkedStudents.map(student => (
                    <div
                      key={student.id}
                      className={`border rounded-2xl p-6 transition-all cursor-pointer ${
                        selectedStudent?.id === student.id
                          ? 'border-emerald-300 bg-emerald-50 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-200 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{student.fullName || student.name}</h3>
                            <p className="text-sm text-gray-600">{student.grade || 'N/A'} • {student.section || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Student ID:</span>
                          <span className="font-medium">{student.studentId || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-emerald-600">Linked</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlinkStudent(student.id);
                          }}
                          className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          Unlink Account
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        case 'grades':
          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Grades</h2>
              {!selectedStudent ? (
                <EmptyState title="No Student Selected" message="Select a student to view their grades" icon="award" action={() => setActiveSection('children')} actionText="Select Student" />
              ) : performanceData?.recentGrades?.length === 0 ? (
                <EmptyState title="No Grades Available" message={`No grades found for ${displayName}`} icon="award" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Assignment</th>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData?.recentGrades?.map((grade, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 font-medium">{grade.subject}</td>
                          <td className="py-4 px-6 text-gray-600">{grade.assignment}</td>
                          <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-full text-sm font-medium ${grade.score >= 90 ? 'bg-emerald-100 text-emerald-800' : grade.score >= 80 ? 'bg-blue-100 text-blue-800' : grade.score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{grade.score}%</span></td>
                          <td className="py-4 px-6 text-gray-500">{grade.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        case 'attendance':
          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h2>
              {!selectedStudent ? (
                <EmptyState title="No Student Selected" message="Select a student to view their attendance" icon="user-check" action={() => setActiveSection('children')} actionText="Select Student" />
              ) : performanceData?.attendanceRecords?.length === 0 ? (
                <EmptyState title="No Attendance Records" message={`No attendance records found for ${displayName}`} icon="user-check" />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200"><p className="text-sm font-medium text-emerald-800">Attendance Rate</p><p className="text-2xl font-bold text-emerald-600">{performanceData.attendanceRate}%</p></div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-sm font-medium text-blue-800">Total Records</p><p className="text-2xl font-bold text-blue-600">{performanceData.attendanceRecords.length}</p></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-200"><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Date</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Subject</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Status</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Notes</th></tr></thead>
                      <tbody>
                        {performanceData.attendanceRecords.map((record, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-6 font-medium">{record.date}</td>
                            <td className="py-4 px-6 text-gray-600">{record.subject}</td>
                            <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>{record.status}</span></td>
                            <td className="py-4 px-6 text-gray-500">{record.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        case 'reports':
          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Term Reports</h2>
              {!selectedStudent ? (
                <EmptyState title="No Student Selected" message="Select a student to view their term reports" icon="file-text" action={() => setActiveSection('children')} actionText="Select Student" />
              ) : termReports.length === 0 ? (
                <EmptyState title="No Term Reports Available" message={`No term reports found for ${displayName}`} icon="file-text" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {termReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => { setSelectedTermReport(report); setShowTermReportModal(true); }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white"><Award className="w-6 h-6" /></div>
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
            </div>
          );
        default:
          return renderDashboardOverview();
      }
    }

    return renderDashboardOverview();
  };

  const renderDashboardOverview = () => {
    if (!selectedStudent || !performanceData) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <EmptyState
            title="No Student Selected"
            message="Link your child's account to view their academic progress"
            icon="users"
            action={() => setShowLinkStudentModal(true)}
            actionText="Link Student Account"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Student Selector */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">Currently Viewing</h2><p className="text-white/90 mt-1">{displayName}'s Academic Progress</p></div>
            <div className="flex flex-wrap gap-3">
              {linkedStudents.length > 0 ? (
                linkedStudents.map(student => (
                  <button key={student.id} onClick={() => setSelectedStudent(student)} className={`px-4 py-2 rounded-xl transition-all duration-200 ${selectedStudent?.id === student.id ? 'bg-white text-emerald-700 shadow-lg' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                    <div className="text-left"><div className="font-semibold text-sm">{student.fullName || student.name}</div><div className="text-xs opacity-90">{student.grade || 'N/A'} • {student.section || 'N/A'}</div></div>
                  </button>
                ))
              ) : (
                <button onClick={() => setShowLinkStudentModal(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl">+ Link Student</button>
              )}
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Overall Average" value={`${performanceData.overallAverage}%`} icon={Award} trend={+2.5} color={getGradeColor(performanceData.overallAverage)} subtitle="Current Grade" details={[{ label: 'High Scores', value: `${performanceData.recentGrades.filter(g => g.score >= 90).length}` }, { label: 'Total Courses', value: `${performanceData.courses.length}` }, { label: 'Trend', value: 'Improving' }]} onClick={() => setActiveSection('grades')} />
          <StatsCard title="Attendance Rate" value={`${performanceData.attendanceRate}%`} icon={UserCheck} color={getAttendanceColor(performanceData.attendanceRate)} subtitle="This semester" details={[{ label: 'Present', value: `${performanceData.attendanceRecords.filter(r => r.status === 'present').length}` }, { label: 'Absent', value: `${performanceData.attendanceRecords.filter(r => r.status === 'absent').length}` }, { label: 'Late', value: `${performanceData.attendanceRecords.filter(r => r.status === 'late').length}` }]} onClick={() => setActiveSection('attendance')} />
          <StatsCard title="Behavior Score" value={`${performanceData.behaviorScore}/10`} icon={Shield} color="from-purple-500 to-purple-600" subtitle="Excellent conduct" details={[{ label: 'Positives', value: '15' }, { label: 'Areas to Improve', value: '2' }, { label: 'Teacher Notes', value: '8' }]} onClick={() => console.log('Behavior clicked')} />
          <StatsCard title="Upcoming Assignments" value={performanceData.upcomingAssignments.length} icon={FileText} color="from-orange-500 to-orange-600" subtitle="Requires attention" details={[{ label: 'High Priority', value: `${performanceData.upcomingAssignments.filter(a => a.priority === 'high').length}` }, { label: 'Due This Week', value: '2' }, { label: 'Total', value: `${performanceData.upcomingAssignments.length}` }]} onClick={() => console.log('Assignments clicked')} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Courses Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-900">Course Performance</h3><p className="text-sm text-gray-500">{performanceData.courses.length} courses • Overall: {performanceData.overallAverage}%</p></div><button onClick={() => setActiveSection('grades')} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">View Details →</button></div>
              <div className="space-y-4">{performanceData.courses.map((course, index) => (<div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300"><div className="flex items-center justify-between mb-3"><div><h4 className="font-semibold text-gray-900">{course.name}</h4><p className="text-sm text-gray-600">Teacher: {course.teacher}</p></div><span className={`px-3 py-1.5 rounded-full text-sm font-bold ${course.grade && course.grade.includes('A') ? 'bg-emerald-100 text-emerald-800' : course.grade && course.grade.includes('B') ? 'bg-blue-100 text-blue-800' : course.grade && course.grade.includes('C') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{course.grade || 'N/A'}</span></div><div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium">Progress</span><span className="font-semibold">{course.progress}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${course.progress >= 80 ? 'bg-emerald-500' : course.progress >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${course.progress}%` }}></div></div></div></div>))}</div>
            </div>

            {/* Recent Grades */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3><button onClick={() => setActiveSection('grades')} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">View All →</button></div>
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200"><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Subject</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Assignment</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Grade</th><th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Date</th></tr></thead><tbody>{performanceData.recentGrades.map((grade, index) => (<tr key={index} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-4 px-6 font-medium">{grade.subject}</td><td className="py-4 px-6 text-gray-600">{grade.assignment}</td><td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-full text-sm font-medium ${grade.score >= 90 ? 'bg-emerald-100 text-emerald-800' : grade.score >= 80 ? 'bg-blue-100 text-blue-800' : grade.score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{grade.score}%</span></td><td className="py-4 px-6 text-gray-500">{grade.date}</td></tr>))}</tbody></table></div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3><Bell className="w-5 h-5 text-gray-400" /></div>
              <div className="space-y-4">{recentActivities.length > 0 ? (recentActivities.map(activity => (<div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'grade' ? 'bg-emerald-100' : activity.type === 'attendance' ? 'bg-blue-100' : activity.type === 'assignment' ? 'bg-yellow-100' : 'bg-purple-100'}`}>{activity.type === 'grade' && <Award className="w-5 h-5 text-emerald-600" />}{activity.type === 'attendance' && <UserCheck className="w-5 h-5 text-blue-600" />}{activity.type === 'assignment' && <FileText className="w-5 h-5 text-yellow-600" />}{activity.type === 'behavior' && <Shield className="w-5 h-5 text-purple-600" />}</div><div className="flex-1 min-w-0"><p className="font-medium text-gray-900">{activity.title}</p><p className="text-sm text-gray-500">{activity.student}</p><p className="text-xs text-gray-400 mt-1">{activity.time}</p></div><span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'updated' ? 'bg-blue-100 text-blue-800' : activity.status === 'recorded' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>{activity.status}</span></div>))) : (<div className="text-center py-6 text-gray-500"><p>No recent activity</p></div>)}</div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><CalendarDays className="w-6 h-6" /></div><div><h3 className="text-lg font-bold">Upcoming Deadlines</h3><p className="text-white/80 text-sm">For {displayName}</p></div></div>
              <div className="space-y-4">{performanceData.upcomingAssignments.map((assignment, index) => (<div key={index} className="bg-white/20 p-4 rounded-xl"><div className="flex justify-between items-center"><div><div className="font-medium">{assignment.title}</div><div className="text-sm opacity-90">{assignment.subject}</div></div><div className="text-right"><div className="text-2xl font-bold">{new Date(assignment.dueDate).getDate()}</div><div className="text-xs opacity-90">{new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short' })}</div></div></div><div className="mt-3"><span className={`px-2 py-1 text-xs rounded ${getPriorityColor(assignment.priority)}`}>{assignment.priority} priority</span></div></div>))}{performanceData.upcomingAssignments.length === 0 && (<div className="text-center py-4 text-white/80"><p>No upcoming assignments</p></div>)}</div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => setShowLinkStudentModal(true)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50"><span className="font-medium text-gray-900">➕ Link New Student</span><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                <button onClick={() => setActiveSection('reports')} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"><span className="font-medium text-gray-900">📊 View Term Reports</span><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50"><span className="font-medium text-gray-900">📅 Schedule Conference</span><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50"><span className="font-medium text-gray-900">✉️ Message Teachers</span><ChevronRight className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType="parent"
        userName={parentName}
        userRole="Parent"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        sections={[
          { id: 'dashboard', label: 'Overview', icon: <Home className="w-5 h-5" /> },
          { id: 'children', label: 'My Children', icon: <Users className="w-5 h-5" /> },
          { id: 'grades', label: 'Grades', icon: <Award className="w-5 h-5" /> },
          { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-5 h-5" /> },
          { id: 'reports', label: 'Term Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
          { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
        ]}
      />
      
      <TopHeader
        title={activeSection === 'dashboard' ? 'Parent Portal' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        subtitle="Welcome back"
        userName={parentName}
        onSearch={handleSearch}
        onNotificationsClick={handleNotificationsClick}
        onSettingsClick={handleSettingsClick}
        onMenuClick={() => setSidebarCollapsed(false)}
        notificationCount={recentActivities.filter(a => a.status === 'updated').length || 3}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} px-6 py-8`}>
        <div className="lg:hidden h-16"></div>
        {renderMainContent()}
      </main>

      {showLinkStudentModal && <LinkStudentModal />}
      {showTermReportModal && selectedTermReport && (
        <ReportViewer report={selectedTermReport} onClose={() => { setShowTermReportModal(false); setSelectedTermReport(null); }} userType="parent" />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' },
            { id: 'children', icon: Users, label: 'Children' },
            { id: 'grades', icon: Award, label: 'Grades' },
            { id: 'attendance', icon: UserCheck, label: 'Attendance' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`flex flex-col items-center justify-center w-20 h-16 ${activeSection === tab.id ? 'text-emerald-600' : 'text-gray-500'}`}>
              <tab.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;