import React, { useState } from 'react';
import { X, Calendar, BookOpen, Upload, FileText } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const PostAssignmentModal = ({ teacherId, teacherName, courses, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: courses?.[0]?.id || '',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16), // Default: 1 week from now
    totalPoints: 100,
    assignmentType: 'homework',
    attachments: [],
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const assignmentTypes = [
    { value: 'homework', label: 'Homework' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'test', label: 'Test' },
    { value: 'project', label: 'Project' },
    { value: 'lab', label: 'Lab Report' },
    { value: 'essay', label: 'Essay' },
    { value: 'presentation', label: 'Presentation' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.courseId) {
      alert('Please select a course');
      return;
    }
    
    setLoading(true);
    
    try {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      
      await addDoc(collection(db, 'assignments'), {
        ...formData,
        teacherId,
        teacherName,
        courseName: selectedCourse?.courseName || 'Unknown Course',
        courseCode: selectedCourse?.courseId || '',
        gradeLevel: selectedCourse?.grade || 'All',
        createdAt: serverTimestamp(),
        submissions: [], // Empty array for student submissions
        published: true,
        assignmentNumber: Math.floor(Math.random() * 100) + 1 // In production, generate sequential number
      });
      
      alert(`✅ Assignment posted to ${selectedCourse?.courseName || 'course'}!`);
      onClose();
    } catch (error) {
      console.error('Error posting assignment:', error);
      alert('❌ Failed to post assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      
      setAttachmentFile(file);
      // In production, you would upload to Firebase Storage
      // For now, we'll just store the filename
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }]
      }));
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const selectedCourse = courses?.find(c => c.id === formData.courseId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold">Post New Assignment</h2>
                <p className="text-sm text-gray-600">Create assignment for your class</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course *
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Select a course...</option>
                {courses?.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseName} - {course.grade} (ID: {course.courseId})
                  </option>
                ))}
              </select>
              {selectedCourse && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCourse.schedule?.days} • {selectedCourse.schedule?.time} • {selectedCourse.schedule?.room}
                </p>
              )}
            </div>

            {/* Title and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Chapter 5: Quadratic Equations"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Type
                </label>
                <select
                  name="assignmentType"
                  value={formData.assignmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {assignmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description & Instructions *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Provide detailed assignment instructions, requirements, and submission guidelines..."
                required
              />
            </div>

            {/* Due Date and Points */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Points
                </label>
                <input
                  type="number"
                  name="totalPoints"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag & drop files or click to browse
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="assignment-file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="assignment-file"
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm"
                >
                  Browse Files
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supports: PDF, Word, Text, Images (Max: 10MB)
                </p>
              </div>
              
              {/* Attachment List */}
              {formData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignment Preview */}
            {formData.title && selectedCourse && (
              <div className="bg-gray-50 p-4 rounded-lg border mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{formData.title}</h3>
                      <p className="text-sm text-gray-600">{selectedCourse.courseName}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">
                        {formData.assignmentType.toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(formData.dueDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-line">{formData.description}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      Posted by: {teacherName}
                    </span>
                    <span className="font-medium">
                      Points: {formData.totalPoints}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.description || !formData.courseId}
                className="flex-1 bg-emerald-500 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post Assignment'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostAssignmentModal;