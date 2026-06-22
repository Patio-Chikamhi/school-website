import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader, Upload, Calendar, User, Mail, Phone, MapPin, 
  BookOpen, X, Key, Eye, EyeOff, UserPlus, ChevronRight,
  Check, Shield, Sparkles, GraduationCap, Heart, Stethoscope,
  Home, Users, Clock, Award, Bell, Lock, Download
} from 'lucide-react';
import { doc, runTransaction, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../firebase/config';
import { generateUniqueId } from '../utils/idGenerator';

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
  
  const gradeOptions = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];
  const classOptions = ['A', 'B', 'C', 'D', 'E'];
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
        email: prev.email || `${id.toLowerCase()}@school.edu`
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

  // ✅ UPDATED: Create parent account WITHOUT affecting admin session
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
        formattedEmail = `${formattedEmail}@parent.school.edu`;
      }
      
      // ✅ Store flag before creating user to prevent redirect
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
        
        // ✅ Clear the flag
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
      if (age < 3 || age > 20) {
        throw new Error('Student age must be between 3 and 20 years');
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
      const accountEmail = formData.email.trim() || `${finalStudentId}@school.edu`;
      const parentEmail = formData.parentEmail.trim() || `${finalStudentId}_parent@school.edu`;
      
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
      
      // Store flag to prevent auth redirect during student creation
      sessionStorage.setItem('adminCreatingUser', 'true');
      
      // Create student user account if requested
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
      
      // Save student document
      const studentDocRef = doc(db, 'students', finalStudentId);
      await setDoc(studentDocRef, {
        ...studentData,
        uid: userUid,
        mustChangePassword: studentData.mustChangePassword || true
      });
      
      // Handle guest users if no account created
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
      
      // CREATE PARENT ACCOUNT
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
      
      // ✅ Clear the admin flag
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
    
    if ((name === 'firstName' || name === 'lastName') && 
        (formData.firstName || value) && 
        (formData.lastName || value) && 
        !studentId) {
      generateStudentId();
    }
    
    if (type === 'checkbox') {
      if (name === 'createAccount') {
        setFormData(prev => ({ 
          ...prev, 
          [name]: checked,
          email: checked && !prev.email && studentId ? `${studentId}@school.edu` : prev.email
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
      return;
    }
    
    if (name === 'email' && value.trim() && !formData.parentEmail.trim()) {
      const domain = value.split('@')[1] || 'school.edu';
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

  const handleGenerateParentPassword = () => {
    const newPassword = generateStrongPassword();
    setFormData(prev => ({
      ...prev,
      parentTempPassword: newPassword
    }));
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
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
Email: ${formData.email || `${studentId}@school.edu`}
Password: ${generatedPassword}
Login URL: https://evergreen.edu/login

PARENT INFORMATION:
Parent Name: ${formData.parentName}
Parent Email: ${formData.parentEmail || `${studentId}_parent@school.edu`}
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

  const renderProgressSteps = () => (
    <div className="px-8 py-6 border-b border-gray-200">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${currentStep > step.id ? 'bg-emerald-600 text-white' : 
                  currentStep === step.id ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600' : 
                  'bg-gray-100 text-gray-400'}
              `}>
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <div className="text-xs mt-2 font-medium text-gray-600 hidden sm:block">
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full ${currentStep > index + 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Register New Student</h2>
                <p className="text-white/90">Complete the form to enroll a new student</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <span className="font-semibold">Step {currentStep} of {steps.length}</span>
              </div>
              {studentId && (
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <span className="font-mono">ID: {studentId}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">{studentId || '----'}</div>
            <p className="text-white/80 text-sm">Student ID</p>
          </div>
        </div>
      </div>

      {/* Success Credentials */}
      {showCredentials && (
        <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4">Student & Parent Registered Successfully!</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900">Student ID</h4>
                  </div>
                  <p className="font-mono text-2xl font-bold text-emerald-700">{studentId}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Student Email</h4>
                  </div>
                  <p className="font-mono text-lg text-blue-700">{formData.email || `${studentId}@school.edu`}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Parent Email</h4>
                  </div>
                  <p className="font-mono text-lg text-purple-700">{formData.parentEmail || `${studentId}_parent@school.edu`}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">Passwords</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Student:</span>
                      <span className="font-mono font-bold">
                        {showPassword ? generatedPassword : '••••••••••••'}
                      </span>
                    </div>
                    {generatedParentPassword && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Parent:</span>
                        <span className="font-mono font-bold">
                          {showPassword ? generatedParentPassword : '••••••••••••'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">Important Notes:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Both student and parent must change passwords on first login</li>
                      <li>• Parent account can monitor student progress through portal</li>
                      <li>• Credentials should be shared securely</li>
                      <li>• Portal access will be activated immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={downloadCredentials}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  Download All Credentials
                </button>
                
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    resetForm();
                    if (onSuccess) onSuccess();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Add Another Student
                </button>
                
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    if (onSuccess) onSuccess();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {!showCredentials && renderProgressSteps()}

      {!showCredentials && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1-4 content remains the same as your original */}
            {/* ... keep all your existing step content ... */}
            
            {/* Navigation Buttons - UPDATED */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      ← Previous Step
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      if (onSuccess) onSuccess();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      Next Step
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Registering Student & Parent...
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