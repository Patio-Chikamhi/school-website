import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
// Replace line 5 with:
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { 
  User, GraduationCap, BookOpen, CheckCircle, 
  ArrowLeft, Mail, Lock, Phone, Calendar, Upload,
  Award, Briefcase, Globe, FileText
} from 'lucide-react';
import { generateUniqueId } from '../utils/idGenerator';

const TeacherSignup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Account Information
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Information
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    
    // Step 3: Professional Information
    qualifications: [''],
    experienceYears: '',
    specialization: [],
    previousSchools: [''],
    
    // Step 4: Subjects & Availability
    subjects: [],
    preferredGrades: [],
    availability: {
      fullTime: true,
      partTime: false,
      availableFrom: ''
    },
    
    // Meta
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Available subjects (can be fetched from Firestore later)
  const availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'English', 'History', 'Geography', 'Computer Science',
    'Art', 'Music', 'Physical Education', 'Foreign Languages'
  ];

  const availableGrades = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  // Progress steps
  const steps = [
    { number: 1, title: 'Account', icon: <User className="w-4 h-4" /> },
    { number: 2, title: 'Personal', icon: <User className="w-4 h-4" /> },
    { number: 3, title: 'Professional', icon: <GraduationCap className="w-4 h-4" /> },
    { number: 4, title: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
    { number: 5, title: 'Review', icon: <CheckCircle className="w-4 h-4" /> }
  ];

  // Validation functions
  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2:
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        break;
        
      case 3:
        if (formData.qualifications[0] === '') newErrors.qualifications = 'At least one qualification is required';
        if (!formData.experienceYears) newErrors.experienceYears = 'Years of experience is required';
        if (formData.specialization.length === 0) newErrors.specialization = 'Please select at least one specialization';
        break;
        
      case 4:
        if (formData.subjects.length === 0) newErrors.subjects = 'Please select at least one subject';
        if (formData.preferredGrades.length === 0) newErrors.preferredGrades = 'Please select preferred grade levels';
        break;
        
      case 5:
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const currentItems = prev[field];
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
      return { ...prev, [field]: newItems };
    });
  };

  const handleSubmit = async () => {
  if (!validateStep(5)) return;
  
  setIsSubmitting(true);
  
  try {
    // ✅ Set flag to prevent auth redirect for admin
    sessionStorage.setItem('adminCreatingUser', 'true');
    
    // Store signup type
    localStorage.setItem('signupType', 'teacher');
    localStorage.setItem('pendingTeacherEmail', formData.email);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    );
    
    const userId = userCredential.user.uid;
    
    // Generate teacher ID
    let teacherIdNumber;
    try {
      teacherIdNumber = await generateUniqueId('teacher');
    } catch (idError) {
      const year = new Date().getFullYear().toString().slice(-2);
      const timestamp = Date.now().toString().slice(-6);
      teacherIdNumber = `TCH${year}${timestamp}`;
    }
    
    // Create user document
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      email: formData.email,
      name: `${formData.firstName} ${formData.lastName}`,
      role: 'teacher',
      status: 'pending',
      teacherId: teacherIdNumber,
      mustChangePassword: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create teacher profile
    const teacherData = {
      userId: userId,
      teacherId: teacherIdNumber,
      personalInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address
      },
      professionalInfo: {
        qualifications: formData.qualifications.filter(q => q.trim() !== ''),
        experienceYears: parseInt(formData.experienceYears) || 0,
        specialization: formData.specialization,
        previousSchools: formData.previousSchools.filter(s => s.trim() !== '')
      },
      subjects: formData.subjects,
      preferredGrades: formData.preferredGrades,
      availability: {
        fullTime: formData.availability.fullTime,
        partTime: formData.availability.partTime,
        availableFrom: formData.availability.availableFrom || null
      },
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          date: new Date().toISOString(),
          note: 'Applied for teacher position'
        }
      ],
      meta: {
        createdAt: new Date().toISOString(),
        applicationDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
    
    await setDoc(doc(db, 'teachers', userId), teacherData);
    
    // ✅ Clear the flag after everything is done
    setTimeout(() => {
      sessionStorage.removeItem('adminCreatingUser');
      localStorage.removeItem('signupType');
      localStorage.removeItem('pendingTeacherEmail');
    }, 3000);
    
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 5000);
    
  } catch (error) {
    console.error('Registration error:', error);
    sessionStorage.removeItem('adminCreatingUser');
    localStorage.removeItem('signupType');
    localStorage.removeItem('pendingTeacherEmail');
    setErrors({
      submit: error.message || 'Failed to create account. Please try again.'
    });
  } finally {
    setIsSubmitting(false);
  }
};

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for applying to join our teaching staff. Your application has been received and is under review.
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Our admin team will review your application
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                You'll receive an email when your application is approved
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Once approved, courses will be assigned to you
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                You can then access your teacher dashboard
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500">
            You will be redirected to the login page in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Join Our Teaching Team
          </h1>
          <p className="text-gray-600 text-lg">
            Complete your application to become a teacher at our school
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
                    ${currentStep >= step.number 
                      ? 'bg-indigo-600' 
                      : 'bg-gray-300'}
                  `}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4
                    ${currentStep > step.number 
                      ? 'bg-indigo-600' 
                      : 'bg-gray-300'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-center">
            <span className="text-sm font-medium text-indigo-600">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Information
                  </h2>
                  <p className="text-gray-600">
                    Create your login credentials
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="At least 6 characters"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Personal Information
                  </h2>
                  <p className="text-gray-600">
                    Tell us about yourself
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Street, City, State, ZIP Code"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Professional Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Professional Information
                  </h2>
                  <p className="text-gray-600">
                    Your qualifications and experience
                  </p>
                </div>
                
                {/* Qualifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4 inline mr-2" />
                    Qualifications & Certifications
                  </label>
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={qual}
                        onChange={(e) => handleArrayFieldChange('qualifications', index, e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., M.Ed in Mathematics, Teaching Certificate"
                      />
                      {formData.qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('qualifications', index)}
                          className="px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('qualifications')}
                    className="mt-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    + Add Another Qualification
                  </button>
                  {errors.qualifications && (
                    <p className="mt-1 text-sm text-red-600">{errors.qualifications}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Years of Teaching Experience
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.experienceYears ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="5"
                      min="0"
                      max="50"
                    />
                    {errors.experienceYears && (
                      <p className="mt-1 text-sm text-red-600">{errors.experienceYears}</p>
                    )}
                  </div>
                </div>
                
                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Specialization
                  </label>
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600 mb-2">{errors.specialization}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSubjects.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleArrayItem('specialization', subject)}
                        className={`
                          p-3 border rounded-lg text-center transition-colors
                          ${formData.specialization.includes(subject)
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Previous Schools */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Previous Schools (Optional)
                  </label>
                  {formData.previousSchools.map((school, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => handleArrayFieldChange('previousSchools', index, e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., ABC High School"
                      />
                      {formData.previousSchools.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('previousSchools', index)}
                          className="px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('previousSchools')}
                    className="mt-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    + Add Another School
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Subjects & Availability */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Teaching Preferences
                  </h2>
                  <p className="text-gray-600">
                    What and who would you like to teach?
                  </p>
                </div>
                
                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects You Can Teach
                  </label>
                  {errors.subjects && (
                    <p className="mt-1 text-sm text-red-600 mb-2">{errors.subjects}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSubjects.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleArrayItem('subjects', subject)}
                        className={`
                          p-3 border rounded-lg text-center transition-colors
                          ${formData.subjects.includes(subject)
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Preferred Grades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Grade Levels
                  </label>
                  {errors.preferredGrades && (
                    <p className="mt-1 text-sm text-red-600 mb-2">{errors.preferredGrades}</p>
                  )}
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {availableGrades.map(grade => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleArrayItem('preferredGrades', grade)}
                        className={`
                          p-3 border rounded-lg text-center transition-colors
                          ${formData.preferredGrades.includes(grade)
                            ? 'bg-purple-100 border-purple-500 text-purple-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        Grade {grade}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Availability */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Availability
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="fullTime"
                          name="availability.fullTime"
                          checked={formData.availability.fullTime}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              fullTime: true,
                              partTime: false
                            }
                          }))}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <label htmlFor="fullTime" className="ml-2 text-gray-700">
                          Full-Time
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="partTime"
                          name="availability.partTime"
                          checked={formData.availability.partTime}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              fullTime: false,
                              partTime: true
                            }
                          }))}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <label htmlFor="partTime" className="ml-2 text-gray-700">
                          Part-Time
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Starting From (Optional)
                      </label>
                      <input
                        type="date"
                        name="availability.availableFrom"
                        value={formData.availability.availableFrom}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Review Your Application
                  </h2>
                  <p className="text-gray-600">
                    Please review your information before submitting
                  </p>
                </div>
                
                <div className="space-y-6">
                  {/* Account Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{formData.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Date of Birth:</span>
                        <p className="font-medium">{formData.dateOfBirth}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Professional Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Qualifications:</span>
                        <ul className="list-disc list-inside mt-1">
                          {formData.qualifications.map((q, i) => (
                            <li key={i} className="font-medium">{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <p className="font-medium">{formData.experienceYears} years</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Specialization:</span>
                        <p className="font-medium">{formData.specialization.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Teaching Preferences */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Teaching Preferences</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600">Subjects:</span>
                        <p className="font-medium">{formData.subjects.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Preferred Grades:</span>
                        <p className="font-medium">Grade {formData.preferredGrades.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Availability:</span>
                        <p className="font-medium">
                          {formData.availability.fullTime ? 'Full-Time' : 'Part-Time'}
                          {formData.availability.availableFrom && 
                            ` from ${formData.availability.availableFrom}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms & Conditions */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-indigo-600"
                      />
                      <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700">
                        I agree to the Terms & Conditions and acknowledge that my application 
                        will be reviewed by the school administration. I understand that 
                        approval may take 3-5 business days.
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>
                
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{errors.submit}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>
              
              <div>
                {currentStep < 5 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Continue to Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <FileText className="w-6 h-6 text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                Application Process Information
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• Your application will be reviewed within 3-5 business days</li>
                <li>• You'll receive email notifications at each stage</li>
                <li>• Once approved, you'll need to complete profile setup</li>
                <li>• Courses will be assigned based on your preferences and availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSignup;