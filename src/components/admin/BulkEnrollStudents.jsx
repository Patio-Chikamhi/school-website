// src/components/admin/BulkEnrollStudents.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, Upload, Download, Search, Filter, CheckCircle,
  XCircle, AlertCircle, Loader, Plus, Trash2, Edit,
  ChevronDown, ChevronRight, FileSpreadsheet, BookOpen,
  GraduationCap, Mail, Phone, Calendar, UserPlus, ClipboardPaste
} from 'lucide-react';
import {
  collection, query, where, getDocs, addDoc, setDoc, doc,
  serverTimestamp, writeBatch, runTransaction, getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

// ============================================
// CONSTANTS
// ============================================

const GRADE_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
const CLASS_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'Arts', 'Sciences', 'Commercials'];

// ============================================
// UNIQUE STUDENT ID GENERATOR (Firestore-based)
// ============================================

const getNextStudentSequence = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const counterId = `student_${year}`;
  const counterRef = doc(db, 'idCounters', counterId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentCount = counterDoc.exists() ? counterDoc.data().count : 0;
      const nextCount = currentCount + 1;

      transaction.set(counterRef, {
        count: nextCount,
        year: year,
        type: 'student',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return nextCount;
    });
    return result;
  } catch (error) {
    console.error('Error getting sequence:', error);
    throw new Error('Failed to generate unique student ID');
  }
};

const generateNextStudentId = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = await getNextStudentSequence();
  return `STU${year}${seq.toString().padStart(4, '0')}`;
};

// ============================================
// MAIN COMPONENT
// ============================================

const BulkEnrollStudents = ({ onComplete }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [courses, setCourses] = useState([]);
  const [matchingCourses, setMatchingCourses] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [results, setResults] = useState({ success: [], failed: [] });
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ============================================
  // FETCH COURSES
  // ============================================

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesList = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(coursesList);
        console.log(`📚 Loaded ${coursesList.length} courses`);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Filter courses when grade changes
  useEffect(() => {
    if (selectedGrade && courses.length > 0) {
      const matching = courses.filter(c =>
        c.grade === selectedGrade && c.isActive !== false
      );
      setMatchingCourses(matching);
      console.log(`📚 Found ${matching.length} courses for ${selectedGrade}`);
    } else {
      setMatchingCourses([]);
    }
  }, [selectedGrade, courses]);

  // ============================================
  // PARSE NAMES FROM PASTE
  // ============================================

  const parseNamesFromPaste = () => {
    if (!pasteData.trim()) {
      alert('Please paste the student names first');
      return;
    }
    if (!selectedGrade) {
      alert('Please select a Form/Grade first');
      return;
    }
    if (!selectedClass) {
      alert('Please select a Class/Section first');
      return;
    }

    const lines = pasteData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const parsedStudents = [];

    lines.forEach((line, index) => {
      let cleanName = line.replace(/^\d+[\.\)\-\s]+/, '').trim();
      cleanName = cleanName.replace(/,$/, '').trim();

      if (!cleanName) return;

      const nameParts = cleanName.split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}`;
      const email = `${emailBase}@evergreen.edu`;

      parsedStudents.push({
        id: index,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        studentId: 'PENDING',
        email,
        grade: selectedGrade,
        class: selectedClass,
        parentName: `Mr./Mrs. ${lastName}`,
        parentEmail: `${emailBase}.parent@gmail.com`,
        status: 'pending'
      });
    });

    if (parsedStudents.length === 0) {
      alert('No valid names found. Please check the format.');
      return;
    }

    setStudents(parsedStudents);
    setShowPreview(true);
    console.log(`✅ Parsed ${parsedStudents.length} students (IDs assigned at enrollment)`);
  };

  // ============================================
  // CSV UPLOAD
  // ============================================

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedGrade) {
      alert('Please select a Form/Grade first');
      return;
    }
    if (!selectedClass) {
      alert('Please select a Class/Section first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const hasFullData = headers.some(h =>
        ['first name', 'firstname', 'first_name', 'email', 'student id', 'studentid'].includes(h)
      );

      const parsedStudents = [];

      if (hasFullData) {
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < 2) continue;

          const firstName = values[0] || '';
          const lastName = values[1] || '';
          const email = values[3] || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@evergreen.edu`;

          parsedStudents.push({
            id: i,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            studentId: 'PENDING',
            email,
            grade: values[4] || selectedGrade,
            class: values[5] || selectedClass,
            parentName: values[6] || `Mr./Mrs. ${lastName}`,
            parentEmail: values[7] || '',
            status: 'pending'
          });
        }
      } else {
        for (let i = 0; i < lines.length; i++) {
          let cleanName = lines[i].replace(/^\d+[\.\)\-\s]+/, '').trim();
          if (!cleanName || cleanName.toLowerCase() === 'name') continue;

          const nameParts = cleanName.split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}`;

          parsedStudents.push({
            id: i,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            studentId: 'PENDING',
            email: `${emailBase}@evergreen.edu`,
            grade: selectedGrade,
            class: selectedClass,
            parentName: `Mr./Mrs. ${lastName}`,
            parentEmail: `${emailBase}.parent@gmail.com`,
            status: 'pending'
          });
        }
      }

      setStudents(parsedStudents);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  // ============================================
  // PROCESS BULK ENROLLMENT
  // ============================================

  const processBulkEnrollment = async () => {
    if (matchingCourses.length === 0) {
      alert(`No courses found for ${selectedGrade}. Please create courses first using the "Seed Courses" button.`);
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: students.length });
    const successList = [];
    const failedList = [];

    sessionStorage.setItem('adminCreatingUser', 'true');

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setProgress({ current: i + 1, total: students.length });

        try {
          // STEP 1: Get unique ID from Firestore counter
          const finalStudentId = await generateNextStudentId();

          // STEP 2: Email collision check
          let accountEmail = student.email;
          const emailCheck = await getDocs(
            query(collection(db, 'users'), where('email', '==', accountEmail))
          );
          if (!emailCheck.empty) {
            const [local, domain] = accountEmail.split('@');
            accountEmail = `${local}.${finalStudentId.toLowerCase()}@${domain}`;
            console.log(`⚠️ Email in use, adjusted to: ${accountEmail}`);
          }

          const tempPassword = `Welcome${finalStudentId}!`;

          // STEP 3: Create Firebase Auth user
          let userUid = null;
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, accountEmail, tempPassword);
            userUid = userCredential.user.uid;
            await updateProfile(userCredential.user, {
              displayName: student.fullName
            });
          } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
              console.warn(`Email ${accountEmail} already exists, skipping auth creation`);
            } else {
              throw authError;
            }
          }

          // STEP 4: Create user document
          if (userUid) {
            const userDocData = {
              uid: userUid,
              email: accountEmail,
              name: student.fullName,
              fullName: student.fullName,
              role: 'student',
              status: 'active',
              studentId: finalStudentId,
              studentDocumentId: finalStudentId,
              grade: student.grade,
              section: student.class,
              parentEmail: student.parentEmail,
              mustChangePassword: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', userUid), userDocData);
          }

          // STEP 5: Create student document with full enrolledCourses
          const enrolledCoursesArray = matchingCourses.map(c => ({
            courseId: c.id,
            courseName: c.courseName,
            subject: c.subject || c.courseName,
            enrollmentDate: new Date(),
            grade: '',
            status: 'active',
            teacherId: c.teacherIds?.[0] || c.teacherId || '',
            teacherName: c.teacherNames?.[0] || c.teacherName || ''
          }));

          const studentData = {
            studentId: finalStudentId,
            firstName: student.firstName,
            lastName: student.lastName,
            fullName: student.fullName,
            email: accountEmail,
            studentEmail: accountEmail,
            grade: student.grade,
            gradeLevel: student.grade,
            class: student.class,
            className: student.class,
            parentName: student.parentName,
            parentEmail: student.parentEmail,
            parentPhone: '',
            address: '',
            dateOfBirth: '',
            isActive: true,
            enrollmentStatus: 'enrolled',
            isEnrolled: matchingCourses.length > 0,
            enrolledCourses: enrolledCoursesArray,
            courses: matchingCourses.map(c => c.courseId),
            attendanceRate: 0,
            performance: {
              overallAverage: 0,
              attendanceRate: 0,
              behaviorScore: 0,
              lastUpdated: serverTimestamp()
            },
            assignments: [],
            grades: [],
            attendanceRecords: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            uid: userUid
          };

          await setDoc(doc(db, 'students', finalStudentId), studentData);

          // STEP 6: Create enrollments collection docs
          for (const course of matchingCourses) {
            const enrollmentId = `${course.id}_${finalStudentId}`;
            await setDoc(doc(db, 'enrollments', enrollmentId), {
              studentId: finalStudentId,
              studentName: student.fullName,
              courseId: course.id,
              courseName: course.courseName,
              subject: course.subject || course.courseName,
              enrolledAt: serverTimestamp(),
              status: 'active',
              teacherIds: course.teacherIds || (course.teacherId ? [course.teacherId] : []),
              teacherNames: course.teacherNames || (course.teacherName ? [course.teacherName] : []),
              grade: course.grade,
              academicYear: course.academicYear || '2024-25'
            });
          }

          successList.push({
            name: student.fullName,
            email: accountEmail,
            password: tempPassword,
            studentId: finalStudentId,
            coursesEnrolled: matchingCourses.length
          });

          console.log(`✅ Enrolled ${student.fullName} (${finalStudentId})`);

        } catch (error) {
          console.error(`❌ Failed to create student ${student.fullName}:`, error);
          failedList.push({
            name: student.fullName,
            error: error.message
          });
        }
      }
    } finally {
      sessionStorage.removeItem('adminCreatingUser');
      setResults({ success: successList, failed: failedList });
      setProcessing(false);
    }
  };

  // ============================================
  // DOWNLOAD RESULTS
  // ============================================

  const downloadResults = () => {
    const csvContent = [
      ['Type', 'Name', 'Email', 'Student ID', 'Password', 'Courses Enrolled', 'Error'],
      ...results.success.map(s => [
        'SUCCESS', s.name, s.email, s.studentId, s.password, s.coursesEnrolled || '', ''
      ]),
      ...results.failed.map(f => ['FAILED', f.name, '', '', '', '', f.error])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setStudents([]);
    setShowPreview(false);
    setResults({ success: [], failed: [] });
    setPasteData('');
    setProgress({ current: 0, total: 0 });
  };

  // ============================================
  // RESULTS VIEW
  // ============================================

  if (results.success.length > 0 || results.failed.length > 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            results.failed.length === 0 ? 'bg-emerald-100' : 'bg-yellow-100'
          }`}>
            {results.failed.length === 0 ? (
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Enrollment Complete</h2>
          <p className="text-gray-600 mt-2">
            Successfully enrolled {results.success.length} students
            {results.failed.length > 0 && `, ${results.failed.length} failed`}
          </p>
          {matchingCourses.length > 0 && (
            <p className="text-sm text-emerald-600 mt-1">
              Each student enrolled in {matchingCourses.length} courses
            </p>
          )}
        </div>

        <div className="space-y-6">
          {results.success.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Successfully Enrolled</h3>
              <div className="bg-emerald-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {results.success.map((student, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{student.name}</span> —
                      ID: <span className="font-mono">{student.studentId}</span> —
                      Password: <code className="bg-white px-2 py-0.5 rounded">{student.password}</code>
                      {student.coursesEnrolled && (
                        <span className="ml-2 text-emerald-600 text-xs">({student.coursesEnrolled} courses)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results.failed.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Failed Enrollments</h3>
              <div className="bg-red-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {results.failed.map((student, idx) => (
                    <div key={idx} className="text-sm text-red-700">
                      <span className="font-medium">{student.name}</span>: {student.error}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <button
              onClick={downloadResults}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Credentials
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Enroll More Students
            </button>
            {onComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN FORM VIEW
  // ============================================

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Bulk Student Enrollment</h2>
        <p className="text-white/90 text-sm sm:text-base">
          Paste or upload student names — they'll be automatically enrolled into all courses for their Form.
        </p>
      </div>

      {/* Step 1: Select Form & Class */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Step 1: Select Form & Class</h3>
            <p className="text-sm text-gray-500">Choose the form and class for these students</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form / Grade *
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">Select Form</option>
              {GRADE_OPTIONS.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class / Section *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">Select Class</option>
              {CLASS_OPTIONS.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedGrade && (
          <div className={`mt-4 p-4 rounded-xl border ${
            matchingCourses.length > 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            {matchingCourses.length > 0 ? (
              <>
                <p className="text-sm font-medium text-emerald-800 mb-2">
                  ✅ Found {matchingCourses.length} courses for {selectedGrade}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingCourses.map(course => (
                    <span
                      key={course.id}
                      className="px-2 py-1 bg-white text-emerald-700 rounded-full text-xs border border-emerald-200"
                    >
                      {course.courseName}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  Each student will be enrolled in all {matchingCourses.length} courses.
                </p>
              </>
            ) : (
              <p className="text-sm text-yellow-800">
                ⚠️ No courses found for {selectedGrade}. Use "Seed Courses" in the dashboard to create them first.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Add Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardPaste className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Paste Names</h3>
              <p className="text-sm text-gray-500">One name per line</p>
            </div>
          </div>

          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder={`Paste student names here, e.g.:\n\nBanda Sharnice\nChatora Mufaro\nChatora Tafara\nChamunorwa Rutendo`}
            rows="10"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
          />

          <button
            onClick={parseNamesFromPaste}
            disabled={!pasteData.trim() || !selectedGrade || !selectedClass}
            className="w-full mt-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Parse Names
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Upload CSV</h3>
              <p className="text-sm text-gray-500">Upload a CSV file with names</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click to upload CSV</p>
              <p className="text-xs text-gray-500 mt-1">
                Names only, one per line, or full details
              </p>
            </label>
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-1">CSV Format Options:</p>
            <p className="text-xs text-gray-500">
              <strong>Simple:</strong> Just names, one per line<br />
              <strong>Full:</strong> FirstName, LastName, StudentID, Email
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Preview */}
      {showPreview && students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Step 3: Preview & Confirm</h3>
                <p className="text-sm text-gray-500">
                  {students.length} students • {matchingCourses.length} courses each • {students.length * matchingCourses.length} total enrollments
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={processBulkEnrollment}
                  disabled={processing || matchingCourses.length === 0}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Enrolling {progress.current}/{progress.total}...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enroll {students.length} Students
                    </>
                  )}
                </button>
              </div>
            </div>

            {processing && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Form</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{student.fullName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 italic">
                      {student.studentId === 'PENDING' ? 'Assigned at enrollment' : student.studentId}
                    </td>
                    <td className="px-4 py-3 text-xs">{student.email}</td>
                    <td className="px-4 py-3 text-sm">{student.grade}</td>
                    <td className="px-4 py-3 text-sm">{student.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkEnrollStudents;