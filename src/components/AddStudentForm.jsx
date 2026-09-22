// src/components/AddStudentForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader, Upload, Calendar, User, Mail, Phone, MapPin, 
  BookOpen, X, Key, Eye, EyeOff, UserPlus, ChevronRight,
  Check, Shield, Sparkles, GraduationCap, Heart, Stethoscope,
  Home, Users, Clock, Award, Bell, Lock, Download, ChevronLeft
} from 'lucide-react';
import { doc, runTransaction, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../firebase/config';

const AddStudentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    createAccount: true,
    grade: '',
    class: '',
    admissionYear: new Date().getFullYear(),
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    emergencyContact: '',
    medicalNotes: '',
    bloodGroup: '',
    createParentAccount: true,
    sendParentCredentials: true,
    parentTempPassword: '',
  });
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedParentPassword, setGeneratedParentPassword] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const fileInputRef = useRef(null);
  
  // ✅ Updated to Form-based grades
  const gradeOptions = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const classOptions = ['A', 'B', 'C', 'D', 'E', 'Arts', 'Sciences', 'Commercials'];
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderOptions = ['Male', 'Female'];
  
  const steps = [
    { id: 1, title: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 2, title: 'Academic Info', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, title: 'Parent Info', icon: <Users className="w-4 h-4" /> },
    { id: 4, title: 'Medical Info', icon: <Heart className="w-4 h-4" /> },
    { id: 5, title: 'Account Setup', icon: <Key className="w-4 h-4" /> }
  ];

  useEffect(() => {
    generateStudentId();
  }, []);

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

  const generateStudentId = async () => {
    try {
      setIsGeneratingId(true);
      const year = new Date().getFullYear().toString().slice(-2);
      const sequenceNumber = await getNextStudentSequence();
      const formattedNumber = sequenceNumber.toString().padStart(4, '0');
      const id = `STU${year}${formattedNumber}`;
      setStudentId(id);
      setFormData(prev => ({
        ...prev,
        email: prev.email || `${id.toLowerCase()}@evergreen.edu`
      }));
      console.log(`✅ Generated unique student ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Error generating student ID:', error);
      const year = new Date().getFullYear().toString().slice(-2);
      const timestamp = Date.now().toString().slice(-6);
      const fallbackId = `STU${year}${timestamp}`;
      setStudentId(fallbackId);
      return fallbackId;
    } finally {
      setIsGeneratingId(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
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
  
  const uploadStudentImage = async (file) => {
    const timestamp = Date.now();
    const filename = `student_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `students/${filename}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const createParentAccount = async (parentEmail, parentName, studentId, studentName) => {
    try {
      const parentQuery = query(
        collection(db, 'users'),
        where('email', '==', parentEmail.trim().toLowerCase()),
        where('role', '==', 'parent')
      );
      const parentSnapshot = await getDocs(parentQuery);
      
      if (!parentSnapshot.empty) {
        const parentDoc = parentSnapshot.docs[0];
        await updateDoc(doc(db, 'users', parentDoc.id), {
          linkedStudents: arrayUnion(studentId),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Updated existing parent account');
        return { uid: parentDoc.id, exists: true };
      }
      
      const parentTempPassword = generateStrongPassword();
      setGeneratedParentPassword(parentTempPassword);
      
      let formattedEmail = parentEmail.trim().toLowerCase();
      if (!formattedEmail.includes('@')) {
        formattedEmail = `${formattedEmail}@parent.evergreen.edu`;
      }
      
      sessionStorage.setItem('adminCreatingUser', 'true');
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, parentTempPassword);
        const userUid = userCredential.user.uid;
        
        await updateProfile(userCredential.user, {
          displayName: parentName.trim() || `Parent of ${studentName}`
        });
        
        const parentData = {
          uid: userUid,
          name: parentName.trim() || `Parent of ${studentName}`,
          email: formattedEmail,
          role: 'parent',
          status: 'active',
          linkedStudents: [studentId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          mustChangePassword: true,
          tempPassword: parentTempPassword,
          permissions: {
            viewGrades: true,
            viewAttendance: true,
            viewAssignments: true,
            viewReports: true,
            receiveNotifications: true
          }
        };
        
        await setDoc(doc(db, 'users', userUid), parentData);
        console.log('✅ Created new parent account');
        
        setTimeout(() => {
          sessionStorage.removeItem('adminCreatingUser');
        }, 1000);
        
        return { uid: userUid, exists: false, tempPassword: parentTempPassword };
        
      } catch (authError) {
        sessionStorage.removeItem('adminCreatingUser');
        console.error('Auth creation failed:', authError.code);
        throw authError;
      }
      
    } catch (error) {
      console.error('❌ Error creating parent account:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setGeneratedPassword('');
    setGeneratedParentPassword('');
    setShowCredentials(false);
    
    try {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.grade) {
        throw new Error('Please fill in all required fields');
      }
      
      const age = calculateAge(formData.dateOfBirth);
      if (age < 3 || age > 25) {
        throw new Error('Student age must be between 3 and 25 years');
      }
      
      const finalStudentId = studentId;
      
      let photoUrl = '';
      if (imageFile) {
        try {
          photoUrl = await uploadStudentImage(imageFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
        }
      }
      
      const finalPassword = password || generateStrongPassword();
      setGeneratedPassword(finalPassword);
      const accountEmail = formData.email.trim() || `${finalStudentId}@evergreen.edu`;
      const parentEmail = formData.parentEmail.trim() || `${finalStudentId}_parent@evergreen.edu`;
      
      const studentData = {
        studentId: finalStudentId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender || 'not_specified',
        grade: formData.grade,
        gradeLevel: formData.grade,
        class: formData.class || '',
        className: formData.class || '',
        admissionYear: formData.admissionYear,
        courses: [],
        averageGrade: '',
        email: accountEmail,
        studentEmail: accountEmail,
        parentName: formData.parentName.trim(),
        parentEmail: parentEmail,
        parentPhone: formData.parentPhone.trim(),
        parentUserId: null,
        linkedParentAccounts: [],
        permissions: {
          parentViewGrades: true,
          parentViewAttendance: true,
          parentViewAssignments: true,
          parentViewReports: true,
        },
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        medicalNotes: formData.medicalNotes.trim(),
        bloodGroup: formData.bloodGroup || '',
        isActive: true,
        enrollmentStatus: 'not_enrolled',
        isEnrolled: false,
        enrolledCourses: [],
        enrollmentDate: null,
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
        photoUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      sessionStorage.setItem('adminCreatingUser', 'true');
      
      let userUid = null;
      if (formData.createAccount) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, accountEmail, finalPassword);
          const user = userCredential.user;
          userUid = user.uid;
          
          await updateProfile(user, {
            displayName: studentData.fullName,
          });
          
          const userDocData = {
            uid: user.uid,
            email: accountEmail,
            name: studentData.fullName,
            fullName: studentData.fullName,
            role: 'student',
            status: 'active',
            studentId: finalStudentId,
            studentDocumentId: finalStudentId,
            grade: studentData.grade,
            section: studentData.class,
            parentEmail: studentData.parentEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            mustChangePassword: true,
            passwordLastChanged: null,
            loginCount: 0
          };
          
          await setDoc(doc(db, 'users', user.uid), userDocData);
          studentData.uid = user.uid;
          studentData.mustChangePassword = true;
          
        } catch (authError) {
          console.error('Auth error:', authError);
          throw new Error(`Student account creation failed: ${authError.message}`);
        }
      }
      
      const studentDocRef = doc(db, 'students', finalStudentId);
      await setDoc(studentDocRef, {
        ...studentData,
        uid: userUid,
        mustChangePassword: studentData.mustChangePassword || true
      });
      
      if (!formData.createAccount) {
        const guestUserData = {
          studentId: finalStudentId,
          studentDocumentId: finalStudentId,
          name: studentData.fullName,
          role: 'student_guest',
          status: 'inactive',
          email: accountEmail,
          parentEmail: studentData.parentEmail,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', `guest_${finalStudentId}`), guestUserData);
        await updateDoc(studentDocRef, {
          isGuest: true,
          guestUserId: `guest_${finalStudentId}`
        });
      }
      
      if (formData.parentEmail.trim() || formData.createParentAccount) {
        try {
          const parentName = formData.parentName.trim() || `Parent of ${studentData.fullName}`;
          
          const parentAccountResult = await createParentAccount(
            parentEmail,
            parentName,
            finalStudentId,
            studentData.fullName
          );
          
          if (parentAccountResult.uid) {
            await updateDoc(studentDocRef, {
              parentUserId: parentAccountResult.uid,
              updatedAt: serverTimestamp()
            });
          }
          console.log('Parent account created/updated successfully');
        } catch (parentError) {
          console.error('Parent creation failed, but student was created:', parentError);
        }
      }
      
      setTimeout(() => {
        sessionStorage.removeItem('adminCreatingUser');
      }, 1000);
      
      setFormData(prev => ({
        ...prev,
        email: accountEmail,
        parentEmail: parentEmail
      }));
      
      setShowCredentials(true);
      
    } catch (error) {
      console.error('Error adding student:', error);
      setError(error.message);
      sessionStorage.removeItem('adminCreatingUser');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      createAccount: true,
      grade: '',
      class: '',
      admissionYear: new Date().getFullYear(),
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      address: '',
      emergencyContact: '',
      medicalNotes: '',
      bloodGroup: '',
      createParentAccount: true,
      sendParentCredentials: true,
      parentTempPassword: '',
    });
    setPassword('');
    setImageFile(null);
    setImagePreview('');
    setError('');
    setCurrentStep(1);
    generateStudentId();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'createAccount') {
        setFormData(prev => ({ 
          ...prev, 
          [name]: checked,
          email: checked && !prev.email && studentId ? `${studentId.toLowerCase()}@evergreen.edu` : prev.email
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
      return;
    }
    
    if (name === 'email' && value.trim() && !formData.parentEmail.trim()) {
      const domain = value.split('@')[1] || 'evergreen.edu';
      const parentEmail = `${value.split('@')[0]}_parent@${domain}`;
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        parentEmail: parentEmail
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  // ✅ STEP VALIDATION
  const validateCurrentStep = () => {
    setError('');
    
    switch (currentStep) {
      case 1: // Personal Info
        if (!formData.firstName.trim()) return 'First name is required';
        if (!formData.lastName.trim()) return 'Last name is required';
        if (!formData.dateOfBirth) return 'Date of birth is required';
        return null;
      
      case 2: // Academic Info
        if (!formData.grade) return 'Form/Grade is required';
        return null;
      
      case 3: // Parent Info
        if (!formData.parentName.trim()) return 'Parent/Guardian name is required';
        if (!formData.parentEmail.trim()) return 'Parent email is required';
        return null;
      
      case 4: // Medical Info - all optional
        return null;
      
      case 5: // Account Setup
        return null;
      
      default:
        return null;
    }
  };

  const nextStep = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleImageChange(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const downloadCredentials = () => {
    const credentials = `
Evergreen Academy - Student Registration
=======================================
STUDENT INFORMATION:
Student ID: ${studentId}
Full Name: ${formData.firstName} ${formData.lastName}
Grade: ${formData.grade}
Class: ${formData.class}

STUDENT PORTAL ACCESS:
Email: ${formData.email || `${studentId}@evergreen.edu`}
Password: ${generatedPassword}

PARENT INFORMATION:
Parent Name: ${formData.parentName}
Parent Email: ${formData.parentEmail || `${studentId}_parent@evergreen.edu`}
${generatedParentPassword ? `Parent Password: ${generatedParentPassword}` : 'Parent Account: Existing account linked'}

IMPORTANT:
• Change passwords on first login
• Keep credentials secure
• Contact admin for support

Generated on: ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([credentials], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credentials_${studentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================
  // STEP CONTENT RENDERERS
  // ============================================

  const renderProgressSteps = () => (
    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm
                ${currentStep > step.id ? 'bg-emerald-600 text-white' : 
                  currentStep === step.id ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600' : 
                  'bg-gray-100 text-gray-400'}
              `}>
                {currentStep > step.id ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step.id}
              </div>
              <div className="text-xs mt-2 font-medium text-gray-600 hidden md:block">
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full ${currentStep > index + 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      // ==========================================
      // STEP 1: PERSONAL INFO
      // ==========================================
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-500">Basic student details</p>
              </div>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo (Optional)</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg" />
                    <button type="button" onClick={removeImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">JPG, PNG or GIF. Max 2MB</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                    {imagePreview ? 'Change Photo' : 'Choose Photo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {formData.dateOfBirth && (
                  <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(formData.dateOfBirth)} years</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      // ==========================================
      // STEP 2: ACADEMIC INFO
      // ==========================================
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Academic Information</h3>
                <p className="text-sm text-gray-500">Grade level and class assignment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form / Grade <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Form</option>
                  {gradeOptions.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class / Section</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Class</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission Year</label>
              <input
                type="number"
                name="admissionYear"
                value={formData.admissionYear}
                onChange={handleChange}
                min="2000"
                max="2100"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 text-sm mb-1">Course Enrollment</p>
                  <p className="text-xs text-blue-700">
                    After registration, you can enroll this student into courses through the Bulk Enroll feature or manually from the Courses Management section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // ==========================================
      // STEP 3: PARENT INFO
      // ==========================================
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Parent / Guardian Information</h3>
                <p className="text-sm text-gray-500">Contact details for the student's parent or guardian</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent / Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Mr. Robert Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="parent@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">A parent account will be created with this email</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Phone</label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+263 77 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+263 77 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="123 Main Street, Harare, Zimbabwe"
              />
            </div>

            {/* Parent Account Settings */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="createParentAccount"
                  checked={formData.createParentAccount}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-purple-900">Create parent portal account</span>
                  <p className="text-xs text-purple-700">Parent can log in to view student progress</p>
                </div>
              </label>
              
              {formData.createParentAccount && (
                <label className="flex items-center gap-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    name="sendParentCredentials"
                    checked={formData.sendParentCredentials}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-purple-900">Send credentials to parent email</span>
                </label>
              )}
            </div>
          </div>
        );

      // ==========================================
      // STEP 4: MEDICAL INFO
      // ==========================================
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medical Information</h3>
                <p className="text-sm text-gray-500">Optional health details (all fields optional)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select Blood Group</option>
                {bloodGroupOptions.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Notes / Allergies</label>
              <textarea
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Any allergies, medical conditions, or special needs the school should know about..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Stethoscope className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 text-sm mb-1">Privacy Notice</p>
                  <p className="text-xs text-yellow-700">
                    Medical information is kept confidential and only accessible to authorized school staff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // ==========================================
      // STEP 5: ACCOUNT SETUP
      // ==========================================
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Account Setup</h3>
                <p className="text-sm text-gray-500">Configure login credentials</p>
              </div>
            </div>

            {/* Student ID Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Student ID (Auto-generated)</p>
                  <p className="font-mono text-2xl font-bold text-emerald-700">{studentId}</p>
                </div>
                <Shield className="w-10 h-10 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="createAccount"
                name="createAccount"
                checked={formData.createAccount}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="createAccount" className="ml-3 text-sm text-gray-700">
                Create student portal account
              </label>
            </div>

            {formData.createAccount && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={`${studentId.toLowerCase()}@evergreen.edu`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                        placeholder="Leave blank to auto-generate"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-medium flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">If left blank, a strong password will be auto-generated</p>
                </div>
              </>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Registration Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Form:</span>
                  <span className="ml-2 font-medium">{formData.grade || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Class:</span>
                  <span className="ml-2 font-medium">{formData.class || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Parent:</span>
                  <span className="ml-2 font-medium">{formData.parentName || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Register New Student</h2>
                <p className="text-white/90 text-sm">Complete the form to enroll a new student</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm">
                <span className="font-semibold">Step {currentStep} of {steps.length}</span>
              </div>
              {studentId && (
                <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm">
                  <span className="font-mono">ID: {studentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Credentials */}
      {showCredentials && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
            </div>
            
            <div className="flex-1 w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-4">
                Student & Parent Registered Successfully!
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Student ID</h4>
                  </div>
                  <p className="font-mono text-lg font-bold text-emerald-700">{studentId}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Student Email</h4>
                  </div>
                  <p className="font-mono text-xs text-blue-700 break-all">{formData.email || `${studentId}@evergreen.edu`}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Parent Email</h4>
                  </div>
                  <p className="font-mono text-xs text-purple-700 break-all">{formData.parentEmail || `${studentId}_parent@evergreen.edu`}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Passwords</h4>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Student:</span>
                      <span className="font-mono font-bold break-all">
                        {showPassword ? generatedPassword : '••••••••'}
                      </span>
                    </div>
                    {generatedParentPassword && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Parent:</span>
                        <span className="font-mono font-bold break-all">
                          {showPassword ? generatedParentPassword : '••••••••'}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 mt-1"
                    >
                      {showPassword ? 'Hide' : 'Show'} passwords
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1 text-sm">Important Notes:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Both student and parent must change passwords on first login</li>
                      <li>• Parent account can monitor student progress through portal</li>
                      <li>• Credentials should be shared securely</li>
                      <li>• Enroll the student into courses via Bulk Enroll or Courses Management</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadCredentials}
                  className="px-4 sm:px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  Download Credentials
                </button>
                
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Add Another Student
                </button>
                
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    if (onSuccess) onSuccess();
                  }}
                  className="px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      {!showCredentials && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Progress Steps */}
          {renderProgressSteps()}

          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mx-4 sm:mx-8 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="p-4 sm:p-8 min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      if (onSuccess) onSuccess();
                    }}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Next Step
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddStudentForm;