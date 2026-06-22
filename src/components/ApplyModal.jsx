// components/ApplyModal.jsx - UPDATED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, User, Mail, Phone, Calendar, Loader } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const ApplyModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Personal Info, 2: Documents, 3: Review
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Student Info
    studentName: '',
    dateOfBirth: '',
    gender: '',
    currentGrade: '',
    gradeApplying: '',
    
    // Parent Info
    parentName: '',
    relationship: '',
    email: '',
    phone: '',
    address: '',
    
    // Documents
    birthCertificate: null,
    reportCard: null,
    studentPhoto: null,
    additionalDocs: [],
    
    // Additional Info
    previousSchool: '',
    specialNeeds: '',
    notes: ''
  });
  
  // File input refs
  const birthCertRef = useRef(null);
  const reportCardRef = useRef(null);
  const photoRef = useRef(null);
  const additionalDocsRef = useRef(null);
  const formRef = useRef(null);

  // Grade options
  const gradeOptions = [
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', 
    '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
    '9th Grade', '10th Grade', '11th Grade', '12th Grade'
  ];

  // Reset scroll when step changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTop = 0;
    }
  }, [step]);

  // Upload file to Firebase Storage
  const uploadFile = async (file, folder, fileName) => {
    if (!file) return null;
    
    try {
      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-.]/g, '');
      const storageRef = ref(storage, `${folder}/${timestamp}_${sanitizedName}`);
      
      setUploadProgress(prev => ({ ...prev, [fileName]: 'uploading' }));
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(prev => ({ ...prev, [fileName]: 'completed' }));
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${fileName}:`, error);
      setUploadProgress(prev => ({ ...prev, [fileName]: 'failed' }));
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Upload all documents first
      const uploadedDocs = {};
      
      if (formData.birthCertificate) {
        uploadedDocs.birthCertificate = await uploadFile(
          formData.birthCertificate,
          'applications/birth_certificates',
          'birth_certificate'
        );
      }
      
      if (formData.reportCard) {
        uploadedDocs.reportCard = await uploadFile(
          formData.reportCard,
          'applications/report_cards',
          'report_card'
        );
      }
      
      if (formData.studentPhoto) {
        uploadedDocs.studentPhoto = await uploadFile(
          formData.studentPhoto,
          'applications/photos',
          'student_photo'
        );
      }
      
      // Upload additional documents
      const additionalDocURLs = [];
      for (const doc of formData.additionalDocs) {
        const url = await uploadFile(
          doc,
          'applications/additional',
          doc.name
        );
        additionalDocURLs.push(url);
      }
      uploadedDocs.additional = additionalDocURLs;

      // Save application to Firestore
      const applicationData = {
        // Student Info
        studentName: formData.studentName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        currentGrade: formData.currentGrade,
        gradeApplying: formData.gradeApplying,
        
        // Parent Info
        parentName: formData.parentName,
        relationship: formData.relationship,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        
        // Documents URLs
        documents: uploadedDocs,
        
        // Additional Info
        previousSchool: formData.previousSchool,
        specialNeeds: formData.specialNeeds,
        notes: formData.notes,
        
        // Application Metadata
        status: 'pending',
        appliedAt: serverTimestamp(),
        applicationId: `APP${Date.now().toString().slice(-8)}`,
        viewed: false,
        
        // System Fields
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'applications'), applicationData);
      
      // Show success message
      alert(`✅ Application submitted successfully!\nApplication ID: ${applicationData.applicationId}\nWe will contact you at ${formData.email}`);
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`❌ Failed to submit application: ${error.message}\nPlease try again or contact the school.`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      studentName: '',
      dateOfBirth: '',
      gender: '',
      currentGrade: '',
      gradeApplying: '',
      parentName: '',
      relationship: '',
      email: '',
      phone: '',
      address: '',
      birthCertificate: null,
      reportCard: null,
      studentPhoto: null,
      additionalDocs: [],
      previousSchool: '',
      specialNeeds: '',
      notes: ''
    });
    setStep(1);
    setUploadProgress({});
  };

  // Handle file upload
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is 5MB.`);
      return;
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (fileType === 'studentPhoto' && !allowedImageTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG) for the photo.');
      return;
    }
    
    if ((fileType === 'birthCertificate' || fileType === 'reportCard') && !allowedDocTypes.includes(file.type)) {
      alert('Please upload a PDF or image file for documents.');
      return;
    }

    setFormData(prev => ({ ...prev, [fileType]: file }));
  };

  // Handle additional docs
  const handleAdditionalDocs = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.size <= 5 * 1024 * 1024 && // 5MB max
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
    );
    
    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only PDF or image files under 5MB are allowed.');
    }
    
    setFormData(prev => ({ 
      ...prev, 
      additionalDocs: [...prev.additionalDocs, ...validFiles] 
    }));
  };

  // Remove file
  const removeFile = (fileType, index = null) => {
    if (fileType === 'additionalDocs') {
      setFormData(prev => ({
        ...prev,
        additionalDocs: prev.additionalDocs.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({ ...prev, [fileType]: null }));
      if (fileType === 'birthCertificate' && birthCertRef.current) birthCertRef.current.value = '';
      if (fileType === 'reportCard' && reportCardRef.current) reportCardRef.current.value = '';
      if (fileType === 'studentPhoto' && photoRef.current) photoRef.current.value = '';
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.studentName && formData.dateOfBirth && 
               formData.gradeApplying && formData.parentName && 
               formData.email && formData.phone;
      case 2:
        return formData.birthCertificate && formData.reportCard && formData.studentPhoto;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Application</h2>
                <p className="text-gray-600">Apply for admission to Evergreen Academy</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === stepNum 
                      ? 'bg-emerald-500 text-white' 
                      : step > stepNum 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > stepNum ? '✓' : stepNum}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step >= stepNum ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepNum === 1 ? 'Personal Info' : stepNum === 2 ? 'Documents' : 'Review'}
                  </span>
                  {stepNum < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step > stepNum ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div 
            ref={formRef}
            className="flex-grow overflow-y-auto p-6"
            style={{ maxHeight: 'calc(90vh - 200px)' }}
          >
            <form onSubmit={handleSubmit} id="application-form">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" /> Student Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.studentName}
                        onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Grade
                      </label>
                      <select
                        value={formData.currentGrade}
                        onChange={(e) => setFormData({...formData, currentGrade: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select current grade</option>
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Applying For *
                      </label>
                      <select
                        value={formData.gradeApplying}
                        onChange={(e) => setFormData({...formData, gradeApplying: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">Select grade</option>
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-8">
                    <User className="w-5 h-5" /> Parent/Guardian Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent/Guardian Name *
                      </label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship to Student
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select relationship</option>
                        <option value="mother">Mother</option>
                        <option value="father">Father</option>
                        <option value="guardian">Guardian</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="parent@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows="2"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="123 Main Street, City, State, ZIP Code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous School (if any)
                    </label>
                    <input
                      type="text"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({...formData, previousSchool: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Previous school name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Needs or Considerations
                    </label>
                    <textarea
                      value={formData.specialNeeds}
                      onChange={(e) => setFormData({...formData, specialNeeds: e.target.value})}
                      rows="2"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Any special needs, allergies, or considerations we should know about"
                    />
                  </div>
                </div>
              )}
              
              {/* Step 2: Document Upload */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Required Documents
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Please upload clear copies of the following documents. Max file size: 5MB each.
                    Accepted formats: PDF, JPG, PNG.
                  </p>
                  
                  {/* Birth Certificate */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Birth Certificate *</h4>
                        <p className="text-sm text-gray-600">Proof of date of birth</p>
                      </div>
                      {formData.birthCertificate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-emerald-600">
                            {uploadProgress.birth_certificate === 'completed' ? '✓ Uploaded' : 
                             uploadProgress.birth_certificate === 'uploading' ? '⏳ Uploading...' : 
                             '📄 Ready'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile('birthCertificate')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <input
                      type="file"
                      ref={birthCertRef}
                      onChange={(e) => handleFileUpload(e, 'birthCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full"
                      required={!formData.birthCertificate}
                    />
                    {formData.birthCertificate && (
                      <p className="text-sm text-gray-500 mt-1">
                        File: {formData.birthCertificate.name} ({(formData.birthCertificate.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  {/* Report Card */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Latest Report Card/Transcript *</h4>
                        <p className="text-sm text-gray-600">Previous academic performance</p>
                      </div>
                      {formData.reportCard ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-emerald-600">
                            {uploadProgress.report_card === 'completed' ? '✓ Uploaded' : 
                             uploadProgress.report_card === 'uploading' ? '⏳ Uploading...' : 
                             '📄 Ready'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile('reportCard')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <input
                      type="file"
                      ref={reportCardRef}
                      onChange={(e) => handleFileUpload(e, 'reportCard')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full"
                      required={!formData.reportCard}
                    />
                    {formData.reportCard && (
                      <p className="text-sm text-gray-500 mt-1">
                        File: {formData.reportCard.name} ({(formData.reportCard.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  {/* Student Photo */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Student Passport Photo *</h4>
                        <p className="text-sm text-gray-600">Recent color photo, plain background</p>
                      </div>
                      {formData.studentPhoto ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-emerald-600">
                            {uploadProgress.student_photo === 'completed' ? '✓ Uploaded' : 
                             uploadProgress.student_photo === 'uploading' ? '⏳ Uploading...' : 
                             '📄 Ready'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile('studentPhoto')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <input
                      type="file"
                      ref={photoRef}
                      onChange={(e) => handleFileUpload(e, 'studentPhoto')}
                      accept=".jpg,.jpeg,.png"
                      className="w-full"
                      required={!formData.studentPhoto}
                    />
                    {formData.studentPhoto && (
                      <p className="text-sm text-gray-500 mt-1">
                        File: {formData.studentPhoto.name} ({(formData.studentPhoto.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  {/* Additional Documents */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Additional Documents (Optional)</h4>
                        <p className="text-sm text-gray-600">Any other relevant documents</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={additionalDocsRef}
                      onChange={handleAdditionalDocs}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full"
                      multiple
                    />
                    
                    {formData.additionalDocs.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.additionalDocs.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile('additionalDocs', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 3: Review and Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Review Your Application</h3>
                  
                  {/* Student Info Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Name:</span> {formData.studentName}</div>
                      <div><span className="text-gray-600">Date of Birth:</span> {formData.dateOfBirth}</div>
                      <div><span className="text-gray-600">Gender:</span> {formData.gender || 'Not specified'}</div>
                      <div><span className="text-gray-600">Current Grade:</span> {formData.currentGrade || 'Not specified'}</div>
                      <div><span className="text-gray-600">Applying for:</span> {formData.gradeApplying}</div>
                      {formData.previousSchool && (
                        <div><span className="text-gray-600">Previous School:</span> {formData.previousSchool}</div>
                      )}
                      {formData.specialNeeds && (
                        <div className="col-span-2"><span className="text-gray-600">Special Needs:</span> {formData.specialNeeds}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Parent Info Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Parent/Guardian Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Name:</span> {formData.parentName}</div>
                      <div><span className="text-gray-600">Relationship:</span> {formData.relationship || 'Not specified'}</div>
                      <div><span className="text-gray-600">Email:</span> {formData.email}</div>
                      <div><span className="text-gray-600">Phone:</span> {formData.phone}</div>
                      {formData.address && (
                        <div className="col-span-2"><span className="text-gray-600">Address:</span> {formData.address}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Documents Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          formData.birthCertificate ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <span>Birth Certificate: {formData.birthCertificate ? '✓ Ready' : '❌ Missing'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          formData.reportCard ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <span>Report Card: {formData.reportCard ? '✓ Ready' : '❌ Missing'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          formData.studentPhoto ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <span>Student Photo: {formData.studentPhoto ? '✓ Ready' : '❌ Missing'}</span>
                      </div>
                      {formData.additionalDocs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Additional Documents: {formData.additionalDocs.length} file(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Notes */}
                  {formData.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-700">{formData.notes}</p>
                    </div>
                  )}
                  
                  {/* Confirmation Checkbox */}
                  <div className="border rounded-lg p-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        required
                        className="mt-1"
                      />
                      <span className="text-sm">
                        I confirm that all information provided is accurate and complete. 
                        I understand that false information may result in application rejection.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer with Navigation Buttons */}
          <div className="flex-shrink-0 border-t bg-white px-6 py-4">
            <div className="flex justify-between">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Back
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!isStepValid() || loading}
                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="application-form"
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;