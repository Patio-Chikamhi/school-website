// AddStudentForm.jsx - Updated to fix studentId mismatch
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Mail, Phone, User, GraduationCap, Home, 
  Calendar, Shield, Loader, CheckCircle, AlertCircle,
  Users, BookOpen, Hash, Lock, Eye, EyeOff
} from 'lucide-react';
import { db, auth } from '../firebase/config';
import { 
  collection, addDoc, doc, setDoc, serverTimestamp,
  getDocs, query, where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const AddStudentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    grade: '',
    section: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    password: '',
    confirmPassword: '',
    admissionDate: '',
    address: '',
    emergencyContact: '',
    previousSchool: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedStudentId, setGeneratedStudentId] = useState('');
  const [emailSuffix] = useState('@school.edu');

  // Generate student ID automatically
  useEffect(() => {
    const generateStudentId = async () => {
      try {
        const year = new Date().getFullYear().toString().substr(-2);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newStudentId = `STU${year}${randomNum}`;
        
        // Check if this studentId already exists in users collection
        const usersQuery = query(
          collection(db, 'users'),
          where('studentId', '==', newStudentId)
        );
        const snapshot = await getDocs(usersQuery);
        
        if (snapshot.empty) {
          setGeneratedStudentId(newStudentId);
          
          // Auto-generate email based on student ID
          if (!formData.email) {
            setFormData(prev => ({
              ...prev,
              email: `${newStudentId.toLowerCase()}@school.edu`
            }));
          }
        } else {
          // If exists, regenerate
          setTimeout(generateStudentId, 100);
        }
      } catch (error) {
        console.error('Error generating student ID:', error);
      }
    };
    
    if (!generatedStudentId) {
      generateStudentId();
    }
  }, [generatedStudentId, formData.email]);

  // Auto-generate username from full name
  useEffect(() => {
    if (formData.fullName && !formData.email.includes('@')) {
      const username = formData.fullName.toLowerCase().replace(/\s+/g, '');
      setFormData(prev => ({
        ...prev,
        email: `${username}${emailSuffix}`
      }));
    }
  }, [formData.fullName, emailSuffix]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!formData.grade) {
      setError('Grade is required');
      return false;
    }
    
    if (!formData.section) {
      setError('Section is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const uid = userCredential.user.uid;
      
      // 2. Create user document in 'users' collection
      const userData = {
        uid: uid,
        name: formData.fullName,
        email: formData.email,
        studentId: generatedStudentId, // Use the same generated ID
        role: 'student',
        grade: formData.grade,
        section: formData.section,
        parentName: formData.parentName || '',
        parentEmail: formData.parentEmail || '',
        parentPhone: formData.parentPhone || '',
        status: 'active',
        mustChangePassword: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Additional fields for reference
        address: formData.address || '',
        emergencyContact: formData.emergencyContact || '',
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0]
      };

      // Save to users collection
      await setDoc(doc(db, 'users', uid), userData);

      // 3. Create student document in 'students' collection with the SAME studentId
      const studentData = {
        uid: uid,
        fullName: formData.fullName,
        email: formData.email,
        studentId: generatedStudentId, // MUST MATCH the one in users collection
        grade: formData.grade,
        section: formData.section,
        parentName: formData.parentName || '',
        parentEmail: formData.parentEmail || '',
        parentPhone: formData.parentPhone || '',
        address: formData.address || '',
        emergencyContact: formData.emergencyContact || '',
        previousSchool: formData.previousSchool || '',
        notes: formData.notes || '',
        enrollmentStatus: 'not_enrolled',
        isEnrolled: false,
        enrolledCourses: [],
        attendance: {},
        grades: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0]
      };

      // Save to students collection
      await setDoc(doc(db, 'students', generatedStudentId), studentData);

      // 4. Create enrollment record
      const enrollmentData = {
        studentId: generatedStudentId,
        studentName: formData.fullName,
        grade: formData.grade,
        section: formData.section,
        enrollmentDate: serverTimestamp(),
        status: 'registered',
        notes: 'New student registration'
      };

      await addDoc(collection(db, 'enrollments'), enrollmentData);

      setSuccess(`Student "${formData.fullName}" added successfully!`);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        grade: '',
        section: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        password: '',
        confirmPassword: '',
        admissionDate: '',
        address: '',
        emergencyContact: '',
        previousSchool: '',
        notes: ''
      });
      
      // Regenerate new student ID for next entry
      setGeneratedStudentId('');
      
      // Notify parent component
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }

    } catch (error) {
      console.error('Error adding student:', error);
      setError(`Failed to add student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Add New Student</h2>
            <p className="text-white/90 mt-1">
              Create a new student account and profile
            </p>
            {generatedStudentId && (
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium">
                  Student ID: <strong>{generatedStudentId}</strong>
                </span>
                <span className="text-xs opacity-90">
                  (Auto-generated)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-700 font-medium">Success!</p>
              <p className="text-emerald-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Student Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter student's full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="student@school.edu"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  @school.edu
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                required
              >
                <option value="">Select Grade</option>
                <option value="9th Grade">9th Grade</option>
                <option value="10th Grade">10th Grade</option>
                <option value="11th Grade">11th Grade</option>
                <option value="12th Grade">12th Grade</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section *
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                required
              >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parent Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Parent/Guardian Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Name
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Parent/Guardian name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Email
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="parent@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Phone
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Account Security Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Account Security</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-10"
                  placeholder="Minimum 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Student will be required to change password on first login
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-10"
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Additional Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission Date
              </label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Student's address"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Name and phone number"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Any additional notes or special instructions..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !generatedStudentId}
            className={`px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center gap-2 ${
              (loading || !generatedStudentId) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Adding Student...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Add Student
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudentForm;