// src/components/admin/BulkEnrollStudents.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, Upload, Download, Search, Filter, CheckCircle,
  XCircle, AlertCircle, Loader, Plus, Trash2, Edit,
  ChevronDown, ChevronRight, FileSpreadsheet, BookOpen,
  GraduationCap, Mail, Phone, Calendar, UserPlus
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const BulkEnrollStudents = ({ onComplete }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [results, setResults] = useState({ success: [], failed: [] });

  const gradeOptions = ['Pre-K', 'Kindergarten', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const classOptions = ['A', 'B', 'C', 'D', 'E'];

  // Fetch existing courses
  useEffect(() => {
    const fetchCourses = async () => {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesList);
    };
    fetchCourses();
  }, []);

  // Generate sample students (20 per grade)
  const generateSampleStudents = () => {
    const sampleStudents = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa', 'Robert', 'Maria', 'William', 'Patricia', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Susan'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'White', 'Harris'];
    
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const studentId = `STU${new Date().getFullYear().toString().slice(-2)}${String(i + 1).padStart(4, '0')}`;
      
      sampleStudents.push({
        id: i,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        studentId,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
        grade: selectedGrade || '9',
        class: selectedClass || 'A',
        parentName: `Mr. & Mrs. ${lastName}`,
        parentEmail: `parent.${lastName.toLowerCase()}@email.com`,
        parentPhone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        address: '123 School Street, City, State',
        dateOfBirth: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${2005 + Math.floor(Math.random() * 10)}`,
        status: 'pending'
      });
    }
    
    setStudents(sampleStudents);
    setShowPreview(true);
  };

  // Parse CSV data
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const parsedStudents = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 5) continue;
        
        parsedStudents.push({
          id: i,
          firstName: values[0]?.trim(),
          lastName: values[1]?.trim(),
          fullName: `${values[0]?.trim()} ${values[1]?.trim()}`,
          studentId: values[2]?.trim() || `STU${Date.now().toString().slice(-6)}${i}`,
          email: values[3]?.trim() || `${values[0]?.toLowerCase()}.${values[1]?.toLowerCase()}@school.edu`,
          grade: values[4]?.trim() || selectedGrade,
          class: values[5]?.trim() || selectedClass,
          parentEmail: values[6]?.trim() || '',
          parentPhone: values[7]?.trim() || '',
          status: 'pending'
        });
      }
      
      setStudents(parsedStudents);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  // Process bulk enrollment
  const processBulkEnrollment = async () => {
    setProcessing(true);
    const successList = [];
    const failedList = [];
    
    // Set flag to prevent auth redirects
    sessionStorage.setItem('adminCreatingUser', 'true');
    
    for (const student of students) {
      try {
        const finalStudentId = student.studentId;
        const accountEmail = student.email;
        const tempPassword = `Welcome${finalStudentId}!`;
        
        // Create Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, accountEmail, tempPassword);
        const userUid = userCredential.user.uid;
        
        await updateProfile(userCredential.user, {
          displayName: student.fullName
        });
        
        // Create user document
        const userDocData = {
          uid: userUid,
          email: accountEmail,
          name: student.fullName,
          fullName: student.fullName,
          role: 'student',
          status: 'active',
          studentId: finalStudentId,
          grade: student.grade,
          section: student.class,
          parentEmail: student.parentEmail,
          mustChangePassword: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', userUid), userDocData);
        
        // Create student document
        const studentData = {
          studentId: finalStudentId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: student.fullName,
          email: accountEmail,
          grade: student.grade,
          class: student.class,
          className: student.class,
          parentName: student.parentName || '',
          parentEmail: student.parentEmail || '',
          parentPhone: student.parentPhone || '',
          address: student.address || '',
          dateOfBirth: student.dateOfBirth || '',
          isActive: true,
          enrollmentStatus: 'enrolled',
          enrolledCourses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          uid: userUid
        };
        
        await setDoc(doc(db, 'students', finalStudentId), studentData);
        
        // Auto-enroll in courses based on grade
        const matchingCourses = courses.filter(course => 
          course.grade === student.grade || 
          course.gradeLevel === student.grade ||
          (course.targetGrade && course.targetGrade.includes(student.grade))
        );
        
        for (const course of matchingCourses) {
          const enrollmentId = `${course.id}_${finalStudentId}`;
          await setDoc(doc(db, 'enrollments', enrollmentId), {
            studentId: finalStudentId,
            studentName: student.fullName,
            courseId: course.id,
            courseName: course.courseName,
            enrolledAt: serverTimestamp(),
            status: 'active',
            teacherId: course.teacherId || null
          });
        }
        
        successList.push({
          name: student.fullName,
          email: accountEmail,
          password: tempPassword,
          studentId: finalStudentId
        });
        
      } catch (error) {
        console.error(`Failed to create student ${student.fullName}:`, error);
        failedList.push({
          name: student.fullName,
          error: error.message
        });
      }
    }
    
    sessionStorage.removeItem('adminCreatingUser');
    setResults({ success: successList, failed: failedList });
    setProcessing(false);
  };

  const downloadResults = () => {
    const csvContent = [
      ['Type', 'Name', 'Email', 'Student ID', 'Password', 'Error'],
      ...results.success.map(s => ['SUCCESS', s.name, s.email, s.studentId, s.password, '']),
      ...results.failed.map(f => ['FAILED', f.name, '', '', '', f.error])
    ].map(row => row.join(',')).join('\n');
    
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
    setSelectedGrade('');
    setSelectedClass('');
    setBulkData('');
  };

  if (results.success.length > 0 || results.failed.length > 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
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
        </div>

        <div className="space-y-6">
          {results.success.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Successfully Enrolled</h3>
              <div className="bg-emerald-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {results.success.map((student, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{student.name}</span> - 
                      ID: {student.studentId} - 
                      Password: <code className="bg-white px-2 py-0.5 rounded">{student.password}</code>
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
                      {student.name}: {student.error}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={downloadResults}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Results
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Bulk Student Enrollment</h2>
        <p className="text-white/90">
          Quickly enroll multiple students at once. Students will be automatically assigned to courses based on their grade level.
        </p>
      </div>

      {/* Generation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Sample Students */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Generate Sample Students</h3>
              <p className="text-sm text-gray-500">Create sample students for testing</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select Grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Section</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select Section</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>Section {cls}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={generateSampleStudents}
              disabled={!selectedGrade}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Generate 20 Students
            </button>
          </div>
        </div>

        {/* Upload CSV */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Upload CSV File</h3>
              <p className="text-sm text-gray-500">Import students from a CSV file</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload CSV</p>
                <p className="text-xs text-gray-500 mt-1">
                  Format: First Name, Last Name, Student ID (optional), Email, Grade, Class, Parent Email
                </p>
              </label>
            </div>
            
            <button
              onClick={() => document.getElementById('csv-upload').click()}
              className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Select CSV File
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">Preview Students</h3>
                <p className="text-sm text-gray-500">{students.length} students ready for enrollment</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processBulkEnrollment}
                  disabled={processing}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Enrolling...
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
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Student ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.slice(0, 10).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{student.fullName}</td>
                    <td className="px-4 py-3 font-mono text-sm">{student.studentId}</td>
                    <td className="px-4 py-3 text-sm">{student.email}</td>
                    <td className="px-4 py-3">Grade {student.grade}</td>
                    <td className="px-4 py-3">Section {student.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length > 10 && (
            <div className="p-4 text-center text-sm text-gray-500 border-t">
              +{students.length - 10} more students not shown
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkEnrollStudents;