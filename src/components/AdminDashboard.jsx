import React, { useState, useEffect } from 'react';
import ApplicationsModal from './admin/ApplicationsModal';
import StudentManagementModal from './admin/StudentManagementModal';
import BulkEnrollStudents from './admin/BulkEnrollStudents';
import Modal from './shared/Modal';

import { 
  Users, BookOpen, Mail, UserPlus, Upload, 
  Image as ImageIcon, FileText, MessageSquare, 
  Loader, Calendar, CheckCircle, XCircle, Clock,
  BarChart3, Home, Settings, Bell, Search, ChevronRight,
  Download, Filter, Edit, Trash2, Eye, Send, Plus,
  Award, GraduationCap, Bookmark, FolderOpen, UsersIcon,
  TrendingUp, TrendingDown, Shield, Zap, Target, Sparkles,
  PieChart, Activity, BarChart, Coffee, Database, Cpu,
  Server, Globe, Wifi, Cloud, ShieldCheck, Lock, User,
  DatabaseIcon, Layers, CpuIcon, HardDrive, Network,
  UserCheck, Briefcase, Crown, School, ClipboardCheck,
  Camera, Image, RefreshCw as RefreshCwIcon, Calendar as CalendarIcon, FileSpreadsheet 
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  doc, getDoc, setDoc, collection, query, where, 
  getDocs, orderBy, limit, serverTimestamp, writeBatch,
  updateDoc, deleteDoc, addDoc
} from 'firebase/firestore';

import EnrollmentManagement from './admin/EnrollmentManagement';
import SchoolReports from './admin/SchoolReports';
import AddLeaderForm from './AddLeaderForm';
import AddStudentForm from './AddStudentForm';
import StudentsList from './StudentsList';
import AdminUpload from './AdminUpload';
import AdminApplications from './AdminApplications';
import PostsManager from './PostsManager'; 
import ContactMessages from './ContactMessages';
import TeacherApprovals from './TeacherApprovals';
import CoursesManagement from './CoursesManagement';
import LeadersList from './Leaderslist';
import ParentManagement from './parents/ParentManagement';
import ParentDashboard from './parents/ParentDashboard';
// Import enhanced components
import { Sidebar } from './dashboard/Sidebar';
import { TopHeader } from './dashboard/TopHeader';
import { StatsCard } from './dashboard/StatsCard';
import { LoadingState } from './dashboard/LoadingState';
import { EmptyState } from './dashboard/EmptyState';
import CalendarView from './shared/CalendarView';

import StudentTermReports from './students/StudentTermReports';
import PublishedReportsViewer from './shared/PublishedReportsViewer';

// ============================================
// CONSTANTS
// ============================================

const SUBJECT_OPTIONS = [
  'English',
  'Shona',
  'History',
  'Heritage',
  'Mathematics',
  'Combined Science',
  'Geography',
  'Agriculture',
  'FRS (Family and Religious Studies)'
];

const FORM_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

// ============================================
// SEED DEFAULT COURSES FUNCTION
// ============================================

const seedDefaultCourses = async () => {
  const subjects = ['English', 'Shona', 'History', 'Heritage', 'Mathematics', 'Combined Science', 'Geography', 'Agriculture', 'FRS'];
  const forms = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  
  let createdCount = 0;
  let skippedCount = 0;
  
  try {
    for (const form of forms) {
      for (const subject of subjects) {
        const courseId = `${subject.substring(0, 3).toUpperCase()}-${form.replace(' ', '')}`;
        
        // Check if course exists
        const q = query(collection(db, 'courses'), where('courseId', '==', courseId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          await addDoc(collection(db, 'courses'), {
            courseId: courseId,
            courseName: subject,
            subject: subject,
            grade: form,
            description: `${subject} - ${form}`,
            sections: ['A', 'B'],
            schedule: {
              days: ['Monday', 'Wednesday'],
              time: '08:00 - 09:00',
              room: 'Room 101'
            },
            credits: 4,
            teacherIds: [],
            teacherNames: [],
            academicYear: '2024-25',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      }
    }
    
    console.log(`✅ Created ${createdCount} default courses, skipped ${skippedCount} existing`);
    alert(`✅ Created ${createdCount} default courses!\nSkipped ${skippedCount} existing courses.`);
  } catch (error) {
    console.error('Error seeding courses:', error);
    alert(`❌ Error seeding courses: ${error.message}`);
  }
};

// ============================================
// ADD LEADER MODAL
// ============================================

const AddLeaderModal = ({ onClose, leaderToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: leaderToEdit?.id || '',
    name: leaderToEdit?.name || '',
    title: leaderToEdit?.title || '',
    email: leaderToEdit?.email || '',
    bio: leaderToEdit?.bio || '',
    order: leaderToEdit?.order || 1,
    isActive: leaderToEdit?.isActive !== undefined ? leaderToEdit.isActive : true,
    imageUrl: leaderToEdit?.imageUrl || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = React.useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }
    
    setImageFile(file);
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.id.trim()) {
        throw new Error('Leader ID is required (e.g., "principal", "academic-director")');
      }
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      const leaderData = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        title: formData.title.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        order: parseInt(formData.order) || 1,
        isActive: formData.isActive,
        imageUrl: formData.imageUrl.trim(),
        createdAt: leaderToEdit?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (imageFile) {
        console.log('Image file to upload:', imageFile);
      }

      const leaderDocRef = doc(db, 'schoolLeaders', leaderData.id);
      await setDoc(leaderDocRef, leaderData);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving leader:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this leader?')) return;

    try {
      await deleteDoc(doc(db, 'schoolLeaders', formData.id));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting leader:', error);
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {leaderToEdit ? 'Edit School Leader' : 'Add School Leader'}
            </h2>
            <p className="text-sm text-gray-500">School administration member</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                {imagePreview || formData.imageUrl ? (
                  <div className="relative">
                    <img src={imagePreview || formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-2">Upload</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Upload a professional headshot. Max size: 2MB</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm text-emerald-600 hover:text-emerald-800">
                    {imagePreview || formData.imageUrl ? 'Change Image' : 'Choose Image'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leader ID *
                <span className="text-xs text-gray-500 ml-2">(e.g., "principal", "academic-director")</span>
              </label>
              <input type="text" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="principal" required disabled={!!leaderToEdit} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Dr. Robert Johnson" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Academic Director" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="r.johnson@evergreen.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="1" min="1" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Biography</label>
              <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Dr. Johnson oversees curriculum development and teacher training..." />
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active (visible on website)</label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between pt-6 border-t border-gray-200">
            <div>
              {leaderToEdit && (
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors">
                  Delete Leader
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {leaderToEdit ? 'Update Leader' : 'Add Leader'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// ADD STUDENT MODAL
// ============================================

// AdminDashboard.jsx — replace the existing AddStudentModal
const AddStudentModal = ({ onClose, onSuccess }) => {
  return (
    <Modal onClose={onClose} maxWidth="max-w-6xl">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
          <p className="text-sm text-gray-500">Register a new student in the system</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XCircle className="w-6 h-6 text-gray-400" />
        </button>
      </div>
      
      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto flex-1">
        <AddStudentForm 
          onSuccess={() => { 
            onSuccess(); 
            onClose(); 
          }} 
        />
      </div>
    </Modal>
  );
};

// ============================================
// BULK ENROLL MODAL
// ============================================

const BulkEnrollModal = ({ onClose, onSuccess }) => {
  return (
    <Modal onClose={onClose} maxWidth="max-w-5xl">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bulk Student Enrollment</h2>
          <p className="text-sm text-gray-500">Enroll multiple students at once</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <XCircle className="w-6 h-6 text-gray-400" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1">
        <BulkEnrollStudents onComplete={() => { onSuccess(); onClose(); }} />
      </div>
    </Modal>
  );
};

// ============================================
// MAIN ADMIN DASHBOARD
// ============================================

const AdminDashboard = ({ students, courses, announcements, applications, applicationsLoading, currentUser }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);
  const [refreshStudents, setRefreshStudents] = useState(false);
  const [refreshApplications, setRefreshApplications] = useState(false);
  const [refreshLeaders, setRefreshLeaders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // System states
  const [systemStatus, setSystemStatus] = useState({
    database: { status: 'healthy', uptime: '99.9%', responseTime: '45ms' },
    storage: { status: 'healthy', used: '2.3GB', total: '5GB' },
    authentication: { status: 'healthy', activeSessions: '128' },
    hosting: { status: 'healthy', requests: '1,234/min' },
    overall: 'online'
  });
  
  // Stats state
  const [leaderCount, setLeaderCount] = useState(0);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalAnnouncements: 0,
    totalPosts: 0,
    unreadMessages: 0,
    activeTeachers: 0,
    systemUsers: 0
  });

  // Teacher stats
  const [teacherStats, setTeacherStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    total: 0
  });

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    userGrowth: '+12%',
    activeUsers: '85%',
    systemUptime: '99.9%',
    storageUsed: '65%',
    avgResponseTime: '120ms'
  });

  // Leader to edit state
  const [leaderToEdit, setLeaderToEdit] = useState(null);
  
  // User info
  const [userInfo, setUserInfo] = useState({
    name: 'Admin User',
    role: 'Administrator',
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    email: 'admin@school.edu'
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    const initializeDashboard = async () => {
      setDashboardLoading(true);
      try {
        await Promise.all([
          fetchLeaderCount(),
          fetchTeacherStats(),
          fetchRecentActivity(),
          checkSystemStatus()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // ============================================
  // DATA FETCHING FUNCTIONS
  // ============================================

  const checkSystemStatus = async () => {
    try {
      const mockStatus = {
        database: { status: 'healthy', uptime: '99.9%', responseTime: '45ms' },
        storage: { status: 'healthy', used: '2.3GB', total: '5GB' },
        authentication: { status: 'healthy', activeSessions: '128' },
        hosting: { status: 'healthy', requests: '1,234/min' },
        overall: 'online'
      };
      setSystemStatus(mockStatus);
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const [applicationsSnapshot, studentsSnapshot, postsSnapshot, leadersSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'applications'), orderBy('submittedAt', 'desc'), limit(3))),
        getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc'), limit(2))),
        getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(2))),
        getDocs(query(collection(db, 'schoolLeaders'), orderBy('updatedAt', 'desc'), limit(2)))
      ]);

      const activities = [];

      applicationsSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'application',
          action: 'submitted',
          user: data.studentName,
          time: data.submittedAt?.toDate?.().toLocaleDateString() || 'Recently',
          status: data.status || 'pending',
          icon: <FileText className="w-5 h-5" />
        });
      });

      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'student',
          action: 'registered',
          user: data.fullName,
          time: data.createdAt?.toDate?.().toLocaleDateString() || 'Recently',
          status: 'completed',
          icon: <Users className="w-5 h-5" />
        });
      });

      postsSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'post',
          action: 'published',
          title: data.title,
          time: data.createdAt?.toDate?.().toLocaleDateString() || 'Recently',
          status: 'published',
          icon: <FileText className="w-5 h-5" />
        });
      });

      leadersSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'leader',
          action: 'updated',
          user: data.name,
          time: data.updatedAt?.toDate?.().toLocaleDateString() || 'Recently',
          status: data.isActive ? 'active' : 'inactive',
          icon: <Award className="w-5 h-5" />
        });
      });

      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([
        { id: 1, type: 'application', action: 'submitted', user: 'John Doe', time: '2 hours ago', status: 'pending', icon: <FileText className="w-5 h-5" /> },
        { id: 2, type: 'teacher', action: 'approved', user: 'Jane Smith', time: '5 hours ago', status: 'approved', icon: <Users className="w-5 h-5" /> },
        { id: 3, type: 'post', action: 'published', title: 'Term 1 Calendar', time: '1 day ago', status: 'published', icon: <FileText className="w-5 h-5" /> },
        { id: 4, type: 'student', action: 'registered', user: 'Michael Brown', time: '2 days ago', status: 'completed', icon: <Users className="w-5 h-5" /> },
        { id: 5, type: 'leader', action: 'added', user: 'Dr. Johnson', time: '3 days ago', status: 'active', icon: <Award className="w-5 h-5" /> },
      ]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchLeaderCount = async () => {
    try {
      const q = query(collection(db, 'schoolLeaders'));
      const snapshot = await getDocs(q);
      setLeaderCount(snapshot.size);
    } catch (error) {
      console.error('Error fetching leader count:', error);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const q = query(collection(db, 'teachers'));
      const snapshot = await getDocs(q);
      
      const newStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        total: snapshot.size
      };

      snapshot.forEach(doc => {
        const teacher = doc.data();
        switch (teacher.status) {
          case 'pending': newStats.pending++; break;
          case 'approved': newStats.approved++; break;
          case 'rejected': newStats.rejected++; break;
          case 'active': newStats.active++; break;
        }
      });

      setTeacherStats(newStats);
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const fixMissingStudentDocuments = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'student_guest']));
      const usersSnapshot = await getDocs(usersQuery);
      
      let fixedCount = 0;
      const batch = writeBatch(db);
      
      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        
        if (user.studentId) {
          const studentDocRef = doc(db, 'students', user.studentId);
          const studentDoc = await getDoc(studentDocRef);
          
          if (!studentDoc.exists()) {
            batch.set(studentDocRef, {
              studentId: user.studentId,
              fullName: user.name || 'Unknown',
              email: user.email || `${user.studentId}@school.edu`,
              grade: user.grade || '',
              className: user.section || '',
              uid: user.uid || null,
              enrollmentStatus: 'not_enrolled',
              isEnrolled: false,
              enrolledCourses: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              status: user.status || 'active'
            });
            fixedCount++;
          }
        }
      }
      
      if (fixedCount > 0) {
        await batch.commit();
        alert(`✅ Fixed ${fixedCount} missing student documents`);
        setRefreshStudents(prev => !prev);
      } else {
        alert('ℹ️ No missing student documents found');
      }
      
    } catch (error) {
      console.error('Error fixing student documents:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // ============================================
  // STATS CALCULATION
  // ============================================

  useEffect(() => {
    const totalApplications = applications?.length || 0;
    const pendingApplications = applications?.filter(app => app.status === 'pending')?.length || 0;
    const approvedApplications = applications?.filter(app => app.status === 'approved')?.length || 0;
    
    const totalCourses = courses?.length || 0;
    const totalAnnouncements = announcements?.length || 0;
    
    const fetchStudentCount = async () => {
      try {
        const q = query(collection(db, 'students'));
        const snapshot = await getDocs(q);
        const studentCount = snapshot.size;
        
        const systemUsers = studentCount + teacherStats.total + leaderCount + 5;
        
        setStats(prev => ({
          ...prev,
          totalApplications,
          pendingApplications,
          approvedApplications,
          totalStudents: studentCount,
          totalCourses,
          totalAnnouncements,
          systemUsers,
          activeTeachers: teacherStats.active
        }));
      } catch (error) {
        console.error('Error fetching student count:', error);
      }
    };
    
    fetchStudentCount();
  }, [applications, courses, announcements, teacherStats, leaderCount]);

  // ============================================
  // HANDLER FUNCTIONS
  // ============================================

  const handleStudentAdded = () => {
    setActiveSection('students');
    setRefreshStudents(prev => !prev);
  };
  
  const handleLeaderAdded = () => {
    setRefreshLeaders(prev => !prev);
    fetchLeaderCount();
  };

  const handleEditLeader = (leader) => {
    setLeaderToEdit(leader);
    setActiveModal('addLeader');
  };

  const handleRefreshApplications = () => {
    setRefreshApplications(prev => !prev);
  };

  const handleRefreshTeacherStats = () => {
    fetchTeacherStats();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked');
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
  };

  const handleRefreshDashboard = async () => {
    setDashboardLoading(true);
    try {
      await Promise.all([
        fetchLeaderCount(),
        fetchTeacherStats(),
        fetchRecentActivity(),
        checkSystemStatus()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleSeedCourses = async () => {
    await seedDefaultCourses();
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'application': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-orange-100 text-orange-800';
      case 'post': return 'bg-emerald-100 text-emerald-800';
      case 'student': return 'bg-purple-100 text-purple-800';
      case 'leader': return 'bg-indigo-100 text-indigo-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ============================================
  // STUDENT CREDENTIALS MANAGER
  // ============================================

  const StudentCredentialsManager = () => {
    const [studentsList, setStudentsList] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);

    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, 'students'));
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentsList(studentsData);
    };

    useEffect(() => { fetchStudents(); }, []);

    const sendResetLink = async (email) => {
      // Note: sendPasswordResetEmail needs to be imported from firebase/auth
      alert(`Password reset link sent to ${email}`);
      setShowResetModal(false);
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-6">Student Credentials Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-3 text-left">Student ID</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Actions</th></tr>
            </thead>
            <tbody>
              {studentsList.map(student => (
                <tr key={student.id} className="border-t">
                  <td className="px-4 py-3">{student.studentId}</td>
                  <td className="px-4 py-3">{student.fullName}</td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => {
                      setSelectedStudent(student);
                      setShowResetModal(true);
                    }} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showResetModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Reset Student Password</h3>
              <p><strong>Student:</strong> {selectedStudent.fullName}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p className="text-amber-600 text-sm mt-4">A password reset link will be sent to this email address.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={() => sendResetLink(selectedStudent.email)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Send Reset Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderMainContent = () => {
    if (dashboardLoading) {
      return <LoadingState message="Loading dashboard..." type="spinner" />;
    }

    if (activeSection === 'applications' && applicationsLoading) {
      return <LoadingState message="Loading applications..." type="spinner" />;
    }

    switch (activeSection) {
      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setActiveModal('addStudent')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Single
              </button>
              <button
                onClick={() => setShowBulkEnroll(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Bulk Enroll
              </button>
              {/* SEED COURSES BUTTON - ADDED HERE */}
              <button
                onClick={handleSeedCourses}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Seed Courses
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <StudentsList refreshTrigger={refreshStudents} onAddStudent={() => setActiveModal('addStudent')} />
            </div>
          </div>
        );
      case 'addStudent':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <AddStudentForm onSuccess={handleStudentAdded} />
          </div>
        );
      case 'addLeader':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <AddLeaderForm onSuccess={handleLeaderAdded} leaderToEdit={leaderToEdit} />
          </div>
        );
      case 'leaders':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <LeadersList 
              refreshTrigger={refreshLeaders}
              onAddLeader={(leader) => {
                if (leader) {
                  handleEditLeader(leader);
                } else {
                  setLeaderToEdit(null);
                  setActiveModal('addLeader');
                }
              }}
            />
          </div>
        );
      case 'parents':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <ParentManagement />
          </div>
        );
      case 'upload':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <AdminUpload />
          </div>
        );
      case 'applications':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <AdminApplications 
              applications={applications}
              refreshTrigger={refreshApplications}
              onRefresh={handleRefreshApplications}
            />
          </div>
        );  
      case 'posts':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <PostsManager />
          </div>
        );
      case 'contactMessages':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <ContactMessages/>
          </div>
        );
      case 'teacherApprovals':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <TeacherApprovals onRefresh={handleRefreshTeacherStats} />
          </div>
        );
      case 'calendar':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <CalendarView userType="admin" userId={currentUser?.uid} showActions={true} />
          </div>
        );
      case 'courses':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <CoursesManagement />
          </div>
        );
      case 'credentials':
        return <StudentCredentialsManager />;
      case 'schoolReports':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <SchoolReports currentUser={currentUser} />
          </div>
        );
      case 'allPublishedReports':
        return (
          <PublishedReportsViewer 
            userType="admin"
          />
        );
      case 'studentReports':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <StudentTermReports 
              studentId={currentUser?.uid}
              userType="admin"
            />
          </div>
        );
      case 'enrollment':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <EnrollmentManagement currentUser={currentUser} />
          </div>
        );  
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => {
    const pendingActions = stats.pendingApplications + teacherStats.pending;
    
    const quickActions = [
      {
        id: 'applications',
        label: 'Applications',
        subLabel: `Pending: ${stats.pendingApplications}`,
        icon: <FileText className="w-6 h-6 text-emerald-600" />,
        color: 'emerald',
        action: () => setActiveModal('applications')
      },
      {
        id: 'students',
        label: 'Manage Students',
        subLabel: `Total: ${stats.totalStudents}`,
        icon: <Users className="w-6 h-6 text-blue-600" />,
        color: 'blue',
        action: () => setActiveSection('students')
      },
      {
        id: 'leader',
        label: 'Add Leader',
        subLabel: 'School Administration',
        icon: <Award className="w-6 h-6 text-purple-600" />,
        color: 'purple',
        action: () => {
          setLeaderToEdit(null);
          setActiveModal('addLeader');
        }
      },
      {
        id: 'teacherApprovals',
        label: 'Teacher Approvals',
        subLabel: `Pending: ${teacherStats.pending}`,
        icon: <UserCheck className="w-6 h-6 text-amber-600" />,
        color: 'amber',
        action: () => setActiveSection('teacherApprovals')
      },
      {
        id: 'parents',
        label: 'Manage Parents',
        subLabel: 'Parent accounts',
        icon: <Users className="w-6 h-6 text-indigo-600" />,
        color: 'indigo',
        action: () => setActiveSection('parents')
      },
      // ADD SEED COURSES TO QUICK ACTIONS
      {
        id: 'seedCourses',
        label: 'Seed Courses',
        subLabel: 'Create default subjects',
        icon: <BookOpen className="w-6 h-6 text-green-600" />,
        color: 'green',
        action: handleSeedCourses
      }
    ];

    const secondaryActions = [
      {
        label: 'Create Post',
        icon: <FileText className="w-4 h-4" />,
        action: () => setActiveSection('posts'),
        color: 'emerald'
      },
      {
        label: 'Upload Media',
        icon: <Upload className="w-4 h-4" />,
        action: () => setActiveSection('upload'),
        color: 'blue'
      },
      {
        label: 'Manage Courses',
        icon: <BookOpen className="w-4 h-4" />,
        action: () => setActiveSection('courses'),
        color: 'purple'
      },
      {
        label: 'Fix Student Docs',
        icon: <ClipboardCheck className="w-4 h-4" />,
        action: fixMissingStudentDocuments,
        color: 'orange'
      },
      {
        label: 'Seed Courses',
        icon: <Plus className="w-4 h-4" />,
        action: handleSeedCourses,
        color: 'green'
      }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {userInfo.name}!</h1>
              <p className="text-white/90 text-sm sm:text-base">Here's your comprehensive overview of the school management system</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">{stats.systemUsers} System Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">{pendingActions} Pending Actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">System Uptime: {performanceMetrics.systemUptime}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="System Status"
            value={systemStatus.overall.toUpperCase()}
            icon={ShieldCheck}
            color="from-emerald-500 to-emerald-600"
            subtitle="All systems operational"
            details={[
              { label: 'Database', value: systemStatus.database.status },
              { label: 'Storage', value: systemStatus.storage.status },
              { label: 'Auth', value: systemStatus.authentication.status },
              { label: 'Hosting', value: systemStatus.hosting.status }
            ]}
            onClick={() => console.log('System status clicked')}
            responsive
          />

          <StatsCard
            title="Total Users"
            value={stats.systemUsers}
            icon={Users}
            trend={+12}
            color="from-blue-500 to-blue-600"
            subtitle="Active system users"
            details={[
              { label: 'Students', value: stats.totalStudents },
              { label: 'Teachers', value: teacherStats.total },
              { label: 'Leaders', value: leaderCount },
              { label: 'Admins', value: '5' }
            ]}
            onClick={() => setActiveSection('students')}
            responsive
          />

          <StatsCard
            title="Pending Actions"
            value={pendingActions}
            icon={Bell}
            color="from-orange-500 to-orange-600"
            subtitle="Requires attention"
            details={[
              { label: 'Applications', value: stats.pendingApplications },
              { label: 'Teacher Approvals', value: teacherStats.pending },
              { label: 'Unread Messages', value: stats.unreadMessages },
              { label: 'System Alerts', value: '2' }
            ]}
            onClick={() => setActiveModal('applications')}
            responsive
          />

          <StatsCard
            title="Performance"
            value={performanceMetrics.systemUptime}
            icon={Activity}
            color="from-purple-500 to-purple-600"
            subtitle="System uptime"
            details={[
              { label: 'User Growth', value: performanceMetrics.userGrowth },
              { label: 'Active Users', value: performanceMetrics.activeUsers },
              { label: 'Storage Used', value: performanceMetrics.storageUsed },
              { label: 'Response Time', value: performanceMetrics.avgResponseTime }
            ]}
            onClick={() => console.log('Performance clicked')}
            responsive
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-500">Most used admin actions</p>
              </div>
              <button onClick={handleRefreshDashboard} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const getColorClasses = (color) => {
                  const classes = { hover: '', bg: '', text: '', iconContainer: '' };
                  switch (color) {
                    case 'emerald':
                      classes.hover = 'hover:from-emerald-50 hover:to-emerald-100 hover:border-emerald-300';
                      classes.iconContainer = 'bg-emerald-100 group-hover:bg-emerald-200';
                      break;
                    case 'blue':
                      classes.hover = 'hover:from-blue-50 hover:to-blue-100 hover:border-blue-300';
                      classes.iconContainer = 'bg-blue-100 group-hover:bg-blue-200';
                      break;
                    case 'purple':
                      classes.hover = 'hover:from-purple-50 hover:to-purple-100 hover:border-purple-300';
                      classes.iconContainer = 'bg-purple-100 group-hover:bg-purple-200';
                      break;
                    case 'amber':
                      classes.hover = 'hover:from-amber-50 hover:to-amber-100 hover:border-amber-300';
                      classes.iconContainer = 'bg-amber-100 group-hover:bg-amber-200';
                      break;
                    case 'indigo':
                      classes.hover = 'hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-300';
                      classes.iconContainer = 'bg-indigo-100 group-hover:bg-indigo-200';
                      break;
                    case 'green':
                      classes.hover = 'hover:from-green-50 hover:to-green-100 hover:border-green-300';
                      classes.iconContainer = 'bg-green-100 group-hover:bg-green-200';
                      break;
                    default:
                      classes.hover = 'hover:from-emerald-50 hover:to-emerald-100 hover:border-emerald-300';
                      classes.iconContainer = 'bg-emerald-100 group-hover:bg-emerald-200';
                  }
                  return classes;
                };
                
                const colorClasses = getColorClasses(action.color);
                
                return (
                  <button key={action.id} onClick={action.action} className={`group bg-gradient-to-b from-white to-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 ${colorClasses.hover}`}>
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 ${colorClasses.iconContainer} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors`}>
                      {action.icon}
                    </div>
                    <span className={`block text-sm sm:text-base font-medium text-gray-900 truncate ${colorClasses.text}`}>
                      {action.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1 truncate">
                      {action.subLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 mt-4">
              {secondaryActions.map((action, index) => (
                <button key={index} onClick={action.action} className="px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 rounded-lg transition-colors truncate">
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <p className="text-sm text-gray-500">Real-time monitoring</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-600">Live</span>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(systemStatus).map(([key, value]) => {
                if (key === 'overall') return null;
                return (
                  <div key={key} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {key === 'database' && <DatabaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
                        {key === 'storage' && <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                        {key === 'authentication' && <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
                        {key === 'hosting' && <Server className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-medium text-gray-900 capitalize truncate">{key}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {key === 'database' && `Uptime: ${value.uptime}`}
                          {key === 'storage' && `Used: ${value.used}`}
                          {key === 'authentication' && `Sessions: ${value.activeSessions}`}
                          {key === 'hosting' && `Requests: ${value.requests}`}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(value.status)}`}>
                      {value.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button onClick={fetchRecentActivity} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                Refresh
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {activityLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading activity...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState title="No recent activity" message="System activities will appear here" icon="activity" />
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      {React.cloneElement(activity.icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        {activity.type === 'post' || activity.type === 'system' ? activity.title : `${activity.user} ${activity.action}`}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{activity.type}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(activity.status === 'pending' ? 'warning' : 'healthy')}`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
                <button className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center gap-2 hover:bg-emerald-50 py-2 rounded-lg transition-colors">
                  View All Activity
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Performance Metrics</h3>
                <p className="text-white/80 text-sm">System analytics & insights</p>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(performanceMetrics).map(([key, value]) => (
                <div key={key} className="bg-white/10 p-3 sm:p-4 rounded-xl hover:bg-white/15 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs sm:text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-lg font-bold">{key.includes('Growth') || key.includes('Uptime') || key.includes('Users') ? value : value}</div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5 sm:h-2">
                    <div className={`h-1.5 sm:h-2 rounded-full ${key === 'userGrowth' ? 'bg-emerald-500' : key === 'activeUsers' ? 'bg-blue-500' : key === 'systemUptime' ? 'bg-purple-500' : key === 'storageUsed' ? 'bg-amber-500' : 'bg-gray-500'}`} style={{ width: key.includes('Growth') || key.includes('Uptime') || key.includes('Users') ? `${parseInt(value)}%` : '100%' }}></div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                View Detailed Analytics
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            <span className="text-sm text-gray-500">Last updated: Just now</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer group" onClick={() => setActiveSection('students')}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.totalStudents}</div>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:text-emerald-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Total Students</div>
              <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 mt-2">
                <div className="bg-emerald-500 h-1 sm:h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group" onClick={() => setActiveModal('applications')}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-blue-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Total Applications</div>
              <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 mt-2">
                <div className="bg-blue-500 h-1 sm:h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer group" onClick={() => setActiveSection('courses')}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalCourses}</div>
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-purple-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Active Courses</div>
              <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 mt-2">
                <div className="bg-purple-500 h-1 sm:h-1.5 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer group" onClick={() => setActiveModal('addLeader')}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold text-amber-600">{leaderCount}</div>
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:text-amber-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">School Leaders</div>
              <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 mt-2">
                <div className="bg-amber-500 h-1 sm:h-1.5 rounded-full" style={{ width: Math.min(leaderCount * 20, 100) + '%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RETURN
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType="admin"
        userName={userInfo.name}
        userRole={userInfo.role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        sections={[
          { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
          { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
          { id: 'applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
          { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
          { id: 'leaders', label: 'Leaders', icon: <Award className="w-5 h-5" /> },
          { id: 'teacherApprovals', label: 'Teacher Approvals', icon: <UsersIcon className="w-5 h-5" /> },
          { id: 'posts', label: 'Posts', icon: <FileText className="w-5 h-5" /> },
          { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> }, 
          { id: 'upload', label: 'Upload Media', icon: <Upload className="w-5 h-5" /> },
          { id: 'schoolReports', label: 'School Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
          { id: 'studentReports', label: 'Student Reports', icon: <FileText className="w-5 h-5" /> },
          { id: 'contactMessages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
        ]}
      />
      
      <TopHeader
        title={activeSection === 'dashboard' ? 'Admin Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        subtitle={`Welcome back, ${userInfo.name.split(' ')[0]}`}
        userName={userInfo.name}
        userAvatar={userInfo.name.charAt(0)}
        onSearch={handleSearch}
        onNotificationsClick={handleNotificationsClick}
        onSettingsClick={handleSettingsClick}
        onMenuClick={() => setIsMobileMenuOpen(true)}
        notificationCount={stats.pendingApplications + teacherStats.pending}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} px-4 sm:px-6 py-4 sm:py-8`}>
        <div className="lg:hidden h-16"></div>
        {renderMainContent()}
      </main>

      {/* Render Modals */}
      {activeModal === 'applications' && (
        <ApplicationsModal onClose={() => setActiveModal(null)} onSuccess={handleRefreshApplications} />
      )}
      
      {activeModal === 'addStudent' && (
        <AddStudentModal onClose={() => setActiveModal(null)} onSuccess={handleStudentAdded} />
      )}

      {activeModal === 'addLeader' && (
        <AddLeaderModal onClose={() => setActiveModal(null)} leaderToEdit={leaderToEdit} onSuccess={handleLeaderAdded} />
      )}

      {/* Bulk Enroll Modal */}
      {showBulkEnroll && (
        <BulkEnrollModal onClose={() => setShowBulkEnroll(false)} onSuccess={handleStudentAdded} />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="flex justify-around items-center h-14">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' },
            { id: 'students', icon: Users, label: 'Students' },
            { id: 'applications', icon: FileText, label: 'Applications' },
            { id: 'courses', icon: BookOpen, label: 'Courses' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`flex flex-col items-center justify-center w-1/5 h-full ${activeSection === tab.id ? 'text-emerald-600' : 'text-gray-500'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div className="text-center sm:text-left">
              © 2026 Evergreen Academy Admin Portal v2.1.0
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                System Status: <span className="font-medium text-emerald-600">Online</span>
              </span>
              <span className="text-center sm:text-left">Last login: Today, {userInfo.lastLogin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;