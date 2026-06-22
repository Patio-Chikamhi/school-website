// src/components/teachers/TeacherMaterials.jsx
import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Download, Trash2, Eye, 
  FolderOpen, Search, Filter, Calendar, Users,
  File, FileSpreadsheet, FileImage, FileArchive,
  Plus, X, Loader, CheckCircle, AlertCircle
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';

const TeacherMaterials = ({ teacherId, teacherCourses, enrolledStudentsByCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials();
    }
  }, [selectedCourse]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const materialsQuery = query(
        collection(db, 'courseMaterials'),
        where('courseId', '==', selectedCourse),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(materialsQuery);
      const materialsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    
    setSelectedFile(file);
    setMaterialTitle(file.name.split('.')[0]);
  };

  const handleUpload = async () => {
  if (!selectedFile || !materialTitle) {
    alert('Please select a file and enter a title');
    return;
  }

  setUploading(true);
  try {
    const course = teacherCourses.find(c => c.id === selectedCourse);
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}_${materialTitle.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;
    const storagePath = `course_materials/${selectedCourse}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, selectedFile);
    const downloadUrl = await getDownloadURL(storageRef);
    
    const materialData = {
      courseId: selectedCourse,
      courseName: course?.courseName || 'Unknown',
      title: materialTitle,
      description: materialDescription,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      fileExt: fileExt,
      storagePath: storagePath,
      downloadUrl: downloadUrl,
      teacherId: teacherId,
      teacherName: course?.teacherName || 'Teacher',
      sharedWithStudents: true,  // ✅ ADD THIS FLAG
      isActive: true,            // ✅ ADD ACTIVE FLAG
      downloads: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'courseMaterials'), materialData);
    await fetchMaterials();
    
    setShowUploadModal(false);
    setSelectedFile(null);
    setMaterialTitle('');
    setMaterialDescription('');
    
    alert('Material uploaded successfully!');
  } catch (error) {
    console.error('Error uploading material:', error);
    alert('Error uploading file: ' + error.message);
  } finally {
    setUploading(false);
  }
};

  const handleDelete = async (material) => {
    try {
      // Delete from Storage
      const storageRef = ref(storage, material.storagePath);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'courseMaterials', material.id));
      
      await fetchMaterials();
      setShowDeleteConfirm(null);
      alert('Material deleted successfully');
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error deleting material: ' + error.message);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType?.includes('word')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
    if (fileType?.includes('image')) return <FileImage className="w-6 h-6 text-purple-500" />;
    if (fileType?.includes('zip') || fileType?.includes('rar')) return <FileArchive className="w-6 h-6 text-yellow-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMaterials = materials.filter(material => {
    if (filterType !== 'all' && material.fileExt !== filterType) return false;
    if (searchTerm && !material.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const fileTypes = ['all', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'zip'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-600 mt-1">Upload and manage learning resources for students</p>
        </div>
        
        {selectedCourse && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Material
          </button>
        )}
      </div>

      {/* Course Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a course...</option>
          {teacherCourses.map(course => (
            <option key={course.id} value={course.id}>
              {course.courseName} - {course.grade || course.gradeLevel}
            </option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {fileTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Materials Grid */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Materials</h3>
              <p className="text-gray-500">Upload learning materials for your students.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getFileIcon(material.fileType)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{material.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          <span>{material.fileName}</span>
                          <span>• {formatFileSize(material.fileSize)}</span>
                          <span>• Uploaded: {material.createdAt?.toLocaleDateString()}</span>
                          <span>• Downloads: {material.downloads || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={material.downloadUrl}
                        download
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => setShowDeleteConfirm(material)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Upload Material</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chapter 1 Notes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the material..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        <span className="text-gray-700">{selectedFile.name}</span>
                        <button className="text-red-600" onClick={() => setSelectedFile(null)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Click to select a file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PPT, Images, ZIP (Max 50MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete "{showDeleteConfirm.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;