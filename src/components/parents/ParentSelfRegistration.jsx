// ParentSelfRegistration.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, Mail, Lock, User, Phone, Shield, Check, AlertCircle,
  GraduationCap, Home, ArrowRight, Loader, Key, Eye, EyeOff, X,
  ArrowLeft, Info, ChevronRight, ChevronLeft, Send, Clock
} from 'lucide-react';
import { db, auth } from '../firebase/config';
import { 
  doc, getDoc, query, collection, where, getDocs, 
  updateDoc, arrayUnion, serverTimestamp, setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const ParentSelfRegistration = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Student Info
    studentId: '',
    studentName: '',
    
    // Step 2: Parent Info
    parentName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 3: Verification
    verificationCode: '',
    agreeTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentVerified, setStudentVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  // Step 1: Verify student
  const verifyStudent = async () => {
    if (!formData.studentId.trim()) {
      setError('Please enter student ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find student by studentId
      const studentsQuery = query(
        collection(db, 'students'),
        where('studentId', '==', formData.studentId.trim().toUpperCase())
      );
      
      const snapshot = await getDocs(studentsQuery);
      
      if (snapshot.empty) {
        setError('Student not found. Please check the Student ID.');
      } else {
        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        
        // Check if student already has a parent linked
        if (studentData.parentEmail && studentData.parentEmail.trim()) {
          setError('This student already has a parent account linked. Please contact the school administration.');
          return;
        }

        // Check if student is active
        if (studentData.enrollmentStatus !== 'enrolled' && studentData.isActive !== true) {
          setError('Student is not currently enrolled or active.');
          return;
        }

        setFormData(prev => ({
          ...prev,
          studentName: studentData.fullName
        }));
        setStudentVerified(true);
        setSuccess(`Student verified: ${studentData.fullName}`);
        setStep(2);
      }
    } catch (error) {
      console.error('Error verifying student:', error);
      setError('Error verifying student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send verification code
  const sendVerificationCode = () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationSent(true);
    
    // In production, you would send this code via email
    // For demo purposes, we'll log it and simulate sending
    console.log('Verification code:', code);
    
    // Simulate email sending
    setSuccess(`Verification code sent to ${formData.email}. Use code: ${code} (Demo only)`);
    
    // In production, you would use an email service
    // await sendEmailVerificationCode(formData.email, code);
  };

  // Step 3: Verify code
  const verifyCode = () => {
    if (formData.verificationCode !== generatedCode) {
      setVerificationAttempts(prev => prev + 1);
      
      if (verificationAttempts >= 2) {
        setError('Too many failed attempts. Please request a new code.');
        setVerificationSent(false);
        setVerificationAttempts(0);
        return;
      }
      
      setError(`Invalid verification code. Attempts: ${verificationAttempts + 1}/3`);
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    // Proceed to create account
    handleCreateAccount();
  };

  // Step 4: Create parent account
  const handleCreateAccount = async () => {
    // Validation
    if (!formData.parentName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email.trim()),
        where('role', '==', 'parent')
      );
      
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        setError('Email already registered. Please use a different email or login.');
        return;
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const userId = userCredential.user.uid;

      // Prepare parent data
      const parentData = {
        uid: userId,
        name: formData.parentName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: 'parent',
        status: 'active',
        linkedStudents: [formData.studentId.trim().toUpperCase()],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mustChangePassword: false, // They just set it
        permissions: {
          viewGrades: true,
          viewAttendance: true,
          viewAssignments: true,
          viewReports: true,
          receiveNotifications: true
        },
        selfRegistered: true,
        registrationDate: serverTimestamp()
      };

      // Create user document
      await setDoc(doc(db, 'users', userId), parentData);

      // Find and update student document
      const studentsQuery = query(
        collection(db, 'students'),
        where('studentId', '==', formData.studentId.trim().toUpperCase())
      );
      
      const studentSnapshot = await getDocs(studentsQuery);
      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        await updateDoc(doc(db, 'students', studentDoc.id), {
          parentEmail: formData.email.trim(),
          parentName: formData.parentName.trim(),
          parentUserId: userId,
          updatedAt: serverTimestamp(),
          linkedParentAccounts: arrayUnion(userId)
        });
      }

      // Success
      setSuccess('Parent account created successfully! You can now login.');
      setStep(4); // Success step
      
      // Auto-login or redirect
      setTimeout(() => {
        // You can redirect to login or parent dashboard
        window.location.href = '/parent-dashboard';
      }, 3000);

    } catch (error) {
      console.error('Error creating parent account:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please use a different email or login.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(`Error creating account: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      studentName: '',
      parentName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      verificationCode: '',
      agreeTerms: false
    });
    setStep(1);
    setError('');
    setSuccess('');
    setStudentVerified(false);
    setVerificationSent(false);
    setGeneratedCode('');
    setVerificationAttempts(0);
  };

  const steps = [
    { number: 1, title: 'Verify Student', icon: <GraduationCap className="w-5 h-5" /> },
    { number: 2, title: 'Parent Details', icon: <User className="w-5 h-5" /> },
    { number: 3, title: 'Verify Email', icon: <Shield className="w-5 h-5" /> },
    { number: 4, title: 'Complete', icon: <Check className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Portal Registration</h1>
          <p className="text-gray-600">Register to access your child's academic information</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.number}>
                <div className={`flex flex-col items-center ${step >= stepItem.number ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    step > stepItem.number 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : step === stepItem.number
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-gray-100'
                  }`}>
                    {step > stepItem.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      stepItem.icon
                    )}
                  </div>
                  <span className="text-sm font-medium">{stepItem.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > stepItem.number ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Student Verification */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 1: Verify Your Child</h2>
                <p className="text-gray-600">Enter your child's student ID to begin registration</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Student ID *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="Enter student ID (e.g., STU2024001)"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    The Student ID is provided by the school. Contact the administration if you don't have it.
                  </p>
                </div>

                {studentVerified && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-800">Student Verified</p>
                        <p className="text-sm text-emerald-700">{formData.studentName}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Link
                    to="/login"
                    className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Back to Login
                  </Link>
                  <button
                    onClick={verifyStudent}
                    disabled={loading || !formData.studentId.trim()}
                    className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Student
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Parent Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 2: Your Information</h2>
                <p className="text-gray-600">Enter your details to create your parent account</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="parent@email.com"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Linked Student
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.studentName}
                        disabled
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 bg-gray-50 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading || !formData.email.trim() || !formData.parentName.trim() || !formData.password.trim() || formData.password.length < 8 || formData.password !== formData.confirmPassword}
                    className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Email Verification */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 3: Verify Your Email</h2>
                <p className="text-gray-600">Enter the verification code sent to your email</p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Email Verification</h3>
                      <p className="text-blue-700">
                        We've sent a 6-digit verification code to <strong>{formData.email}</strong>.
                        Please check your inbox and enter the code below.
                      </p>
                      {generatedCode && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                          <p className="text-sm font-mono text-blue-800">
                            Demo Code: <span className="font-bold">{generatedCode}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code *
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-center text-2xl tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-5 h-5 text-emerald-600 rounded mt-1"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-emerald-600 hover:text-emerald-800 font-medium">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-emerald-600 hover:text-emerald-800 font-medium">
                      Privacy Policy
                    </Link>
                    . I understand that I will have access to my child's academic information.
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => {
                        setVerificationSent(false);
                        setGeneratedCode('');
                        sendVerificationCode();
                      }}
                      className="flex-1 px-4 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                    >
                      Resend Code
                    </button>
                    <button
                      onClick={verifyCode}
                      disabled={loading || !formData.verificationCode.trim() || formData.verificationCode.length !== 6 || !formData.agreeTerms}
                      className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin inline mr-2" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Create Account'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Complete!</h2>
                <p className="text-gray-600 mb-8">
                  Your parent account has been created successfully. You can now access your child's academic information.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Account Details:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.parentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Linked Student:</span>
                      <span className="font-medium">{formData.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium">{formData.studentId}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    to="/parent-dashboard"
                    className="block w-full px-6 py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-center"
                  >
                    Go to Parent Dashboard
                  </Link>
                  <button
                    onClick={resetForm}
                    className="block w-full px-6 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Register Another Child
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
              Sign in here
            </Link>
          </p>
          <p>
            Need help?{' '}
            <Link to="/support" className="text-emerald-600 hover:text-emerald-800 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentSelfRegistration;