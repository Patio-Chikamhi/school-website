import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Palette, 
  Globe, 
  Cpu, 
  Music, 
  FlaskRound, 
  Code, 
  Users, 
  Target,
  Award,
  Clock,
  Calendar,
  ChevronRight, GraduationCap, Loader, Mail, CalendarDays, FileText, Check, ChevronDown, Import
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
// FIREBASE IMPORTS
import { db, auth, storage } from './firebase/config';
import {
  collection, query, onSnapshot, doc, setDoc, serverTimestamp,
  getDocs, where, orderBy, getDoc, limit, addDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import {
  signInAnonymously, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, updateProfile,
  signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider
} from 'firebase/auth';
import Header from './components/Header';
import { Link, useLocation, NavLink } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ForceChangePassword from './components/ForceChangePassword';
import Gallery from './components/gallery';
import AdminLogin from './components/AdminLogin';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard.jsx';
import Newsletter from './components/Newsletter';
import HomeView from './components/homeView';
import PostDetail from './components/PostDetail';
import PostsPage from './components/PostsPage';
import ContactView from './components/ContactView'; 
import TeacherSignup from './components/TeacherSignup';
import StudentLogin from './components/StudentLogin';
import CoursesManagement from './components/CoursesManagement';
import AcademicsView from './components/AcademicsView';
import AboutView from './components/AboutView';
import AdmissionsView from './components/AdmissionsView';
import TeacherDashboardWrapper from './components/teachers/TeacherDashboard';
import StudentDashboardWrapper from './components/StudentDashboard';
import ParentDashboard from './components/parents/ParentDashboard';
import ParentLogin from './components/parents/ParentLogin';
import TeacherLogin from './components/teachers/TeacherLogin';
import FinanceDashboard from './components/finance/FinanceDashboard';
import FinanceLogin from './components/finance/FinanceLogin';

import './App.css';
const SCHOOL_NAME = "Evergreen Academy";
const NAVIGATION_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Admissions', path: '/admissions' },
  { name: 'Academics', path: '/academics' },
  { 
    name: 'Media & Gallery', 
    hasDropdown: true,
    dropdownItems: [
      { name: 'Photo Gallery', path: '/gallery' },
      { name: 'Posts', path: '/posts' },
    ]
  },
  { name: 'Contact Us', path: '/contact' },
];

const SectionTitle = ({ children }) => (
  <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 border-b-4 border-emerald-500 inline-block pb-1">
    {children}
  </h2>
);

const ImageWithFallback = ({ src, alt, className, fallbackSrc = "https://placehold.co/600x400/CCCCCC/000000?text=Image+Not+Found" }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallbackSrc)}
      loading="lazy"
    />
  );
};

// Setup function for teacher-specific data
const setupTeacherData = async (teacherId, userData) => {
  try {
    await setDoc(doc(db, 'teachers', teacherId), {
      uid: teacherId,
      name: userData.name,
      email: userData.email,
      teacherId: userData.teacherId,
      department: userData.department || '',
      courses: userData.courses || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`✅ Teacher data created for ${teacherId}`);
  } catch (error) {
    console.error("❌ Error setting up teacher data:", error);
  }
};

// Setup function for student-specific data
const setupStudentData = async (studentId, userData) => {
  try {
    await setDoc(doc(db, 'students', studentId), {
      uid: studentId,
      name: userData.name,
      email: userData.email,
      studentId: userData.studentId,
      grade: userData.grade || '',
      section: userData.section || '',
      courses: userData.courses || [],
      parentName: userData.parentName || '',
      parentEmail: userData.parentEmail || '',
      parentPhone: userData.parentPhone || '',
      attendance: {},
      grades: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`✅ Student data created for ${studentId}`);
  } catch (error) {
    console.error("❌ Error setting up student data:", error);
  }
};

const Footer = () => (
  <footer className="bg-gray-800 mt-12">
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:justify-between">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">{SCHOOL_NAME}</span>
          </div>
          <p className="text-gray-400 text-sm">1400 Pine Street, City, State 12345</p>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Evergreen Academy. All rights reserved.</p>
        </div>
        <div className="mt-8 md:mt-0">
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4 text-center md:text-left">Quick Links</h3>
          <ul className="text-center md:text-left space-y-2">
            {NAVIGATION_LINKS.map(link => (
              <li key={link.name}>
                <Link to={link.path} className="text-base text-gray-400 hover:text-emerald-400 transition duration-150 ease-in-out">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </footer>
);

// Function to create test leaders
const createTestLeaders = async (db) => {
  if (!db) return;
  try {
    const leadersSnapshot = await getDocs(collection(db, 'schoolLeaders'));
    if (leadersSnapshot.empty) {
      const testLeaders = [
        {
          id: "principal-test",
          name: "Dr. Penelope Sterling",
          title: "Head of School",
          bio: "With over 20 years of educational leadership experience...",
          imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
          email: "p.sterling@evergreen.edu",
          order: 1,
          isActive: true
        },
        {
          id: "dean-test",
          name: "Mr. Jonathan Chen",
          title: "Dean of Students",
          bio: "Mr. Chen brings 15 years of experience...",
          imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
          email: "j.chen@evergreen.edu",
          order: 2,
          isActive: true
        }
      ];
      for (const leader of testLeaders) {
        await setDoc(doc(db, 'schoolLeaders', leader.id), {
          ...leader,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log('✅ Test leaders created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating test leaders:', error);
  }
};

// getDashboardPath function
const getDashboardPath = (role) => {
  switch (role) {
    case 'student': return '/student/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'parent': return '/parent/dashboard';
    case 'admin': return '/dashboard';
    default: return '/';
  }
};

// --- Main Application Component ---
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceChangePassword, setForceChangePassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // State for collections
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [newsletters, setNewsletters] = useState([]);
  const [newslettersLoading, setNewslettersLoading] = useState(true);
  const [newslettersError, setNewslettersError] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('Database status:', db ? 'Connected' : 'Not connected');
  console.log('Current User:', currentUser);

  const showFooterRoutes = [
    '/', '/about', '/admissions', '/academics', 
    '/gallery', '/contact', '/posts', '/teacher-signup',
    '/student/login', '/admin/login', '/forgot-password'
  ];
  
  const showFooter = showFooterRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  useEffect(() => {
    if (db && currentUser && currentUser.role === 'admin') {
      createTestLeaders(db);
    }
  }, [db, currentUser]);

  // 1. FIREBASE INITIALIZATION - UPDATED WITH FIXES
  useEffect(() => {
  console.log('Using Firebase from config file...');

  if (!db || !auth) {
    console.log('Waiting for Firebase initialization...');
    setLoading(false);
    return;
  }

  console.log('Firebase ready from config');

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    // ✅ CRITICAL: Check if admin is creating a user - skip auth redirect
    if (sessionStorage.getItem('adminCreatingUser') === 'true') {
      console.log("👤 Admin is creating a user - skipping auth redirect");
      setLoading(false);
      return;
    }

    if (user) {
      console.log("User authenticated:", user.uid, user.email);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        console.log("📄 User document exists:", userDoc.exists());

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("✅ Existing user data loaded:", userData);
          const mustChangePwd = userData.mustChangePassword === true;
          const userRole = userData.role;

          setCurrentUser({
            uid: user.uid,
            ...userData,
            email: userData.email || user.email,
            name: userData.name || user.displayName || user.email?.split('@')[0],
            mustChangePassword: mustChangePwd
          });

          // ✅ Only redirect non-admin users who must change password
          if (mustChangePwd === true && 
              userRole !== 'admin' && 
              userRole !== 'parent' &&
              !window.location.pathname.includes('/force-change-password') &&
              !window.location.pathname.includes('/admin')) {
            console.log("🔒 Non-admin user must change password - redirecting");
            setForceChangePassword(true);
            navigate('/force-change-password');
          }
        } else {
          console.log("🆕 New user - checking signup type...");

          const signupType = localStorage.getItem('signupType');
          const pendingTeacherEmail = localStorage.getItem('pendingTeacherEmail');
          
          let role = 'user';
          let status = 'active';
          let mustChangePassword = false;

          // Check if this is a new user created by admin (parent/student account)
          const isAdminCreated = sessionStorage.getItem('adminCreatingUser');
          
          // ✅ PRIORITY 1: User created by admin
          if (isAdminCreated === 'true') {
            console.log("👤 User created by admin - setting appropriate role without redirect");
            if (user.email.includes('_parent@') || user.email.includes('@parent.')) {
              role = 'parent';
            } else {
              role = 'student';
            }
            status = 'active';
            mustChangePassword = true;
          }
          // ✅ PRIORITY 2: Teacher signup from localStorage
          else if (signupType === 'teacher' || (pendingTeacherEmail && user.email === pendingTeacherEmail)) {
            role = 'teacher';
            status = 'pending';
            mustChangePassword = true;
            console.log("🎯 TEACHER SIGNUP DETECTED");
            localStorage.removeItem('signupType');
            localStorage.removeItem('pendingTeacherEmail');
          } 
          // ✅ PRIORITY 3: Parent signup
          else if (signupType === 'parent') {
            role = 'parent';
            status = 'pending';
            mustChangePassword = true;
            console.log("🎯 PARENT SIGNUP DETECTED");
            localStorage.removeItem('signupType');
          } 
          // ✅ PRIORITY 4: Admin email
          else if (user.email === 'admin@school.edu') {
            role = 'admin';
            status = 'active';
            mustChangePassword = false;
            console.log("🎯 ADMIN USER DETECTED");
          }
          // ✅ PRIORITY 5: Check if teacher document exists (to prevent overwriting)
          else {
            // Check if a teacher document exists for this user
            try {
              const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
              if (teacherDoc.exists()) {
                role = 'teacher';
                status = teacherDoc.data().status || 'pending';
                mustChangePassword = false;
                console.log("🎯 EXISTING TEACHER DETECTED - setting role: teacher");
              } else {
                // Also check teachers collection by userId field
                const teachersQuery = query(
                  collection(db, 'teachers'),
                  where('userId', '==', user.uid)
                );
                const teachersSnapshot = await getDocs(teachersQuery);
                if (!teachersSnapshot.empty) {
                  role = 'teacher';
                  status = teachersSnapshot.docs[0].data().status || 'pending';
                  mustChangePassword = false;
                  console.log("🎯 EXISTING TEACHER DETECTED (by userId) - setting role: teacher");
                } else {
                  role = 'student';
                  status = 'active';
                  mustChangePassword = true;
                  console.log("🎯 STUDENT SIGNUP (default)");
                }
              }
            } catch (teacherCheckError) {
              console.warn("Error checking teacher document:", teacherCheckError);
              role = 'student';
              status = 'active';
              mustChangePassword = true;
            }
          }

          console.log(`🆕 Creating user document with role: ${role}, mustChangePassword: ${mustChangePassword}`);

          const newUserData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
            role: role,
            status: status,
            mustChangePassword: mustChangePassword,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Only add role-specific fields for students (teachers don't need studentId)
          if (role === 'student') {
            newUserData.studentId = `STU${Date.now().toString().slice(-6)}`;
            newUserData.grade = '';
            newUserData.section = '';
          } else if (role === 'teacher') {
            newUserData.teacherId = `TCH${Date.now().toString().slice(-6)}`;
            newUserData.department = '';
          } else if (role === 'parent') {
            newUserData.parentId = `PAR${Date.now().toString().slice(-6)}`;
            newUserData.childrenIds = [];
          }

          await setDoc(userDocRef, newUserData);
          console.log(`✅ Created user document with role: ${role}`);
          
          // Only update currentUser if this is not an admin-created user
          if (isAdminCreated !== 'true') {
            setCurrentUser({ uid: user.uid, ...newUserData });
          }

          // Only redirect for non-admin, non-admin-created users
          if (mustChangePassword === true && role !== 'admin' && isAdminCreated !== 'true') {
            console.log("🔒 Redirecting to force change password");
            setForceChangePassword(true);
            navigate('/force-change-password');
          }
        }
      } catch (error) {
        console.error("❌ Error handling user data:", error);
        if (sessionStorage.getItem('adminCreatingUser') !== 'true') {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
            role: 'user',
            status: 'error',
            mustChangePassword: false
          });
        }
      }
    } else {
      // Only clear currentUser if not in admin creation mode
      if (sessionStorage.getItem('adminCreatingUser') !== 'true') {
        setCurrentUser(null);
        setForceChangePassword(false);
        console.log("👤 User logged out");
      }
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, [db, auth, navigate]);

  // ============================================
  // DATA FETCHING EFFECTS
  // ============================================

  // 2. Fetch Applications
  useEffect(() => {
    if (!db) return;

    console.log('📋 Fetching applications...');

    const applicationsCollectionRef = collection(db, 'applications');
    const applicationsQuery = query(applicationsCollectionRef, orderBy('appliedAt', 'desc'));

    setApplicationsLoading(true);

    const unsubscribeApplications = onSnapshot(applicationsQuery,
      (snapshot) => {
        console.log('✅ Applications snapshot received:', snapshot.size);
        const fetchedApplications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate() : new Date(data.appliedAt || Date.now()),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
          };
        });
        setApplications(fetchedApplications);
        setApplicationsLoading(false);
        setApplicationsError(null);
      },
      (error) => {
        console.error("❌ Error fetching applications:", error);
        setApplicationsError("Failed to fetch applications.");
        setApplicationsLoading(false);
        setApplications([]);
      }
    );

    return () => unsubscribeApplications();
  }, [db]);

  // 3. Fetch Events
  useEffect(() => {
    if (!db) return;

    const eventsCollectionRef = collection(db, 'events');
    const eventsQuery = query(
      eventsCollectionRef,
      where('isActive', '==', true),
      orderBy('eventDate', 'asc')
    );

    setEventsLoading(true);

    const unsubscribeEvents = onSnapshot(eventsQuery,
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : new Date(data.eventDate || Date.now()),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate || Date.now()),
          };
        });
        setEvents(fetchedEvents);
        setEventsLoading(false);
        setEventsError(null);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setEventsError("Failed to fetch events.");
        setEventsLoading(false);
        setEvents([]);
      }
    );

    return () => unsubscribeEvents();
  }, [db]);

  // 4. FETCH STUDENTS
  useEffect(() => {
    if (!db) return;

    console.log('👥 Fetching students from Firestore...');

    const studentsCollectionRef = collection(db, 'students');
    const studentsQuery = query(
      studentsCollectionRef,
      orderBy('fullName', 'asc')
    );

    setStudentsLoading(true);

    const unsubscribeStudents = onSnapshot(studentsQuery,
      (snapshot) => {
        const fetchedStudents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`✅ Students fetched: ${fetchedStudents.length}`);
        setStudents(fetchedStudents);
        setStudentsLoading(false);
        setStudentsError(null);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setStudentsError("Failed to fetch students.");
        setStudentsLoading(false);
        setStudents([]);
      }
    );

    return () => unsubscribeStudents();
  }, [db]);

  // 5. FETCH COURSES - CRITICAL FOR TEACHER DASHBOARD
  useEffect(() => {
    if (!db) return;

    console.log('📚 Fetching courses from Firestore...');

    const coursesCollectionRef = collection(db, 'courses');
    const coursesQuery = query(
      coursesCollectionRef,
      orderBy('courseName', 'asc')
    );

    setCoursesLoading(true);

    const unsubscribeCourses = onSnapshot(coursesQuery,
      (snapshot) => {
        const fetchedCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`✅ Courses fetched: ${fetchedCourses.length}`);
        setCourses(fetchedCourses);
        setCoursesLoading(false);
        setCoursesError(null);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        setCoursesError("Failed to fetch courses.");
        setCoursesLoading(false);
        setCourses([]);
      }
    );

    return () => unsubscribeCourses();
  }, [db]);

  // 6. Fetch Gallery
  useEffect(() => {
    if (!db) return;

    const galleryCollectionRef = collection(db, 'gallery');

    setGalleryLoading(true);

    const unsubscribeGallery = onSnapshot(galleryCollectionRef,
      (snapshot) => {
        const fetchedGallery = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGalleryItems(fetchedGallery);
        setGalleryLoading(false);
        setGalleryError(null);
      },
      (error) => {
        console.error("Error fetching gallery:", error);
        setGalleryError("Failed to fetch gallery images.");
        setGalleryLoading(false);
        setGalleryItems([]);
      }
    );

    return () => unsubscribeGallery();
  }, [db]);

  // 7. Fetch Notifications
  useEffect(() => {
    if (!db || !currentUser) return;
  
    const fetchNotifications = async () => {
      try {
        if (currentUser.role === 'student') {
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('studentId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
          });
          return () => unsubscribe();
        }
        
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('recipientRole', 'in', [currentUser.role, 'all']),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
  
    fetchNotifications();
  }, [db, currentUser]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header
        currentUser={currentUser}
        auth={auth}
        SCHOOL_NAME={SCHOOL_NAME}
        NAVIGATION_LINKS={NAVIGATION_LINKS} 
      />

      <Routes>
        {/* Force Change Password Route - MUST BE FIRST */}
        <Route 
          path="/force-change-password" 
          element={
            currentUser && currentUser.mustChangePassword ? (
              <ForceChangePassword 
                user={currentUser}
                onComplete={() => {
                  setForceChangePassword(false);
                  const dashboardPath = getDashboardPath(currentUser.role);
                  navigate(dashboardPath);
                  window.location.reload();
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Forgot Password Route */}
        <Route 
          path="/forgot-password" 
          element={
            <ForgotPassword onBackToLogin={() => navigate('/student/login')} />
          } 
        />

        {/* Public Routes */}
        <Route path="/" element={
          <HomeView
            announcements={announcements}
            announcementsLoading={announcementsLoading}
            announcementsError={announcementsError}
            newsletters={newsletters}
            newslettersLoading={newslettersLoading}
            newslettersError={newslettersError}
          />
        } />

        <Route path="/about" element={<AboutView />} />
        <Route path="/admissions" element={<AdmissionsView />} />
        <Route path="/academics" element={
          <AcademicsView
            courses={courses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
          />
        } />
        
        <Route 
          path="/students" 
          element={
            <PrivateRoute user={currentUser} requiredRole={['admin', 'teacher']}>
              <StudentsView
                students={students}
                studentsLoading={studentsLoading}
                studentsError={studentsError}
                currentUser={currentUser}
                db={db}
              />
            </PrivateRoute>
          } 
        />

        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<ContactView />} />
        
        <Route path="/admin/login" element={
          currentUser ? <Navigate to="/dashboard" /> : <AdminLogin />
        } />

        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts" element={<PostsPage />} />

        <Route 
          path="/newsletters" 
          element={
            <Newsletter 
              userRole={currentUser?.role}
              currentUser={currentUser}
            />
          } 
        />

        <Route path="/teacher-signup" element={<TeacherSignup />} />
        
        <Route path="/courses" element={
          <PrivateRoute user={currentUser} requiredRole={['admin', 'teacher']}>
            <CoursesManagement />
          </PrivateRoute>
        } />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute user={currentUser} requiredRole={null}>
              <Dashboard
                currentUser={currentUser}
                students={students}
                courses={courses}
                announcements={announcements}
                applications={applications}
                applicationsLoading={applicationsLoading}
              />
            </PrivateRoute>
          }
        />

        <Route 
          path="/student/dashboard" 
          element={
            <PrivateRoute user={currentUser} requiredRole={['student']}>
              <StudentDashboardWrapper currentUser={currentUser} />
            </PrivateRoute>
          }
        />

        <Route 
          path="/teacher/dashboard" 
          element={
            <PrivateRoute user={currentUser} requiredRole={['teacher', 'admin']}>
              <TeacherDashboardWrapper 
                currentUser={currentUser} 
                courses={courses}
                students={students}
              />
            </PrivateRoute>
          }
        />

        <Route path="/teacher/login" element={
          currentUser ? <Navigate to="/teacher/dashboard" /> : <TeacherLogin />
        } />

        <Route path="/parent/login" element={<ParentLogin />} />
        
        <Route 
          path="/parent/dashboard" 
          element={
            <PrivateRoute user={currentUser} requiredRole={['parent']}>
              <ParentDashboard currentUser={currentUser} />
            </PrivateRoute>
          }
        />
        
        <Route path="/student/login" element={<StudentLogin />} />

        <Route path="/finance/login" element={<FinanceLogin />} />
        <Route 
            path="/finance/dashboard" 
             element={
               <PrivateRoute user={currentUser} requiredRole={['finance', 'admin']}>
                 <FinanceDashboard currentUser={currentUser} />
               </PrivateRoute>
           } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showFooter && <Footer />}
    </div>
  );
};

// StudentsView Component
const StudentsView = ({ students, studentsLoading, studentsError, currentUser, db }) => {
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (!db) return;
    const checkCollections = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsRef);
        const studentRef = collection(db, 'student');
        const studentSnapshot = await getDocs(studentRef);
        setDebugInfo(`Students: ${studentsSnapshot.size} docs, Student: ${studentSnapshot.size} docs`);
      } catch (error) {
        console.error('Error checking collections:', error);
        setDebugInfo(`Error: ${error.message}`);
      }
    };
    checkCollections();
  }, [db]);

  return (
    <main className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle>Student Portal</SectionTitle>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800"><strong>Debug Info:</strong> {debugInfo}</p>
          <p className="text-sm text-yellow-800 mt-1">User Role: {currentUser?.role || 'none'}, Auth: {currentUser ? 'Yes' : 'No'}</p>
        </div>
        {!currentUser || !['admin', 'teacher'].includes(currentUser?.role) ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Access restricted to staff members only.</p>
          </div>
        ) : studentsLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="w-8 h-8 animate-spin mr-3" />
            <p>Loading student data...</p>
          </div>
        ) : studentsError ? (
          <div className="text-center py-10 text-red-600">
            <p>Error: {studentsError}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No student records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map(student => (
              <div key={student.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg">{student.fullName || student.name}</h3>
                <p className="text-gray-600">Grade: {student.grade}{student.section}</p>
                <p className="text-sm text-gray-500">{student.email}</p>
                <p className="text-xs text-gray-400 mt-2">Parent: {student.parentName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default App;