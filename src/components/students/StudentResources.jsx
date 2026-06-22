// components/students/StudentResources.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Video,
  Image as ImageIcon,
  Download,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  Star,
  Eye,
  Share2,
  Bookmark,
  File,
  FileSpreadsheet,
  Presentation,
  Music,
  Archive,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentResources = ({ studentId, enrolledCourses }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [downloading, setDownloading] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      if (!studentId || !enrolledCourses || enrolledCourses.length === 0) {
        setResources([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get course IDs from enrolled courses
        const courseIds = enrolledCourses.map(course => course.courseId);
        console.log('Fetching resources for courses:', courseIds);
        
        // Fetch materials for each course
        let allResources = [];
        
        for (const courseId of courseIds) {
          try {
            // ✅ FIXED: Query without the 'sharedWithStudents' filter first to see what's there
            const resourcesQuery = query(
              collection(db, 'courseMaterials'),
              where('courseId', '==', courseId),
              orderBy('createdAt', 'desc')
            );
            
            const resourcesSnapshot = await getDocs(resourcesQuery);
            console.log(`Found ${resourcesSnapshot.docs.length} materials for course ${courseId}`);
            
            const courseResources = resourcesSnapshot.docs.map(doc => {
              const data = doc.data();
              const course = enrolledCourses.find(c => c.courseId === courseId);
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                uploadedAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                courseName: course?.courseName || data.courseName || courseId,
                teacherName: data.teacherName || 'Teacher',
                type: data.fileType || data.type || getFileTypeFromUrl(data.downloadUrl),
                fileSize: data.fileSize || 0,
                downloads: data.downloads || 0,
                views: data.views || 0,
                title: data.title || 'Untitled Resource',
                description: data.description || '',
                fileUrl: data.downloadUrl || data.fileUrl
              };
            });
            
            allResources = [...allResources, ...courseResources];
          } catch (error) {
            console.error(`Error fetching resources for course ${courseId}:`, error);
          }
        }
        
        console.log('Total resources found:', allResources.length);
        setResources(allResources);
        
        // Load recently viewed from localStorage
        const viewed = JSON.parse(localStorage.getItem('recentlyViewedResources') || '[]');
        setRecentlyViewed(viewed);
        
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [studentId, enrolledCourses]);

  const getFileTypeFromUrl = (url) => {
    if (!url) return 'other';
    
    const extension = url.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx', 'txt'].includes(extension)) return 'document';
    if (['mp4', 'mov', 'avi', 'wmv', 'webm'].includes(extension)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
    return 'other';
  };

  const filteredResources = resources.filter(resource => {
    if (searchQuery && 
        !resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !resource.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedCourse !== 'all' && resource.courseId !== selectedCourse) {
      return false;
    }
    
    if (filterType !== 'all' && resource.type !== filterType) {
      return false;
    }
    
    return true;
  });

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'document': return <File className="w-5 h-5" />;
      case 'presentation': return <Presentation className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getFileTypeName = (type) => {
    switch(type) {
      case 'pdf': return 'PDF Document';
      case 'video': return 'Video';
      case 'document': return 'Document';
      case 'presentation': return 'Presentation';
      case 'image': return 'Image';
      case 'audio': return 'Audio';
      case 'spreadsheet': return 'Spreadsheet';
      case 'archive': return 'Archive';
      default: return 'File';
    }
  };

  const getFileColor = (type) => {
    switch(type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'presentation': return 'bg-amber-100 text-amber-800';
      case 'image': return 'bg-emerald-100 text-emerald-800';
      case 'audio': return 'bg-pink-100 text-pink-800';
      case 'spreadsheet': return 'bg-green-100 text-green-800';
      case 'archive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (resource) => {
    if (!resource.fileUrl) {
      alert('No file available for download');
      return;
    }
    
    setDownloading(resource.id);
    
    try {
      // Update download count in Firestore
      const resourceRef = doc(db, 'courseMaterials', resource.id);
      await updateDoc(resourceRef, {
        downloads: (resource.downloads || 0) + 1,
        lastDownloadedAt: new Date()
      });
      
      // Track in recently viewed
      const viewed = JSON.parse(localStorage.getItem('recentlyViewedResources') || '[]');
      const newViewed = viewed.filter(item => item.id !== resource.id);
      newViewed.unshift({
        id: resource.id,
        title: resource.title,
        courseName: resource.courseName,
        type: resource.type,
        downloadedAt: new Date().toISOString()
      });
      
      if (newViewed.length > 10) newViewed.pop();
      localStorage.setItem('recentlyViewedResources', JSON.stringify(newViewed));
      setRecentlyViewed(newViewed);
      
      // Open download in new tab
      window.open(resource.fileUrl, '_blank');
      
      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, downloads: (r.downloads || 0) + 1 }
          : r
      ));
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleView = async (resource) => {
    if (!resource.fileUrl) {
      alert('No file available to view');
      return;
    }
    
    // Track view
    const viewed = JSON.parse(localStorage.getItem('recentlyViewedResources') || '[]');
    const newViewed = viewed.filter(item => item.id !== resource.id);
    newViewed.unshift({
      id: resource.id,
      title: resource.title,
      courseName: resource.courseName,
      type: resource.type,
      viewedAt: new Date().toISOString()
    });
    
    if (newViewed.length > 10) newViewed.pop();
    localStorage.setItem('recentlyViewedResources', JSON.stringify(newViewed));
    setRecentlyViewed(newViewed);
    
    // Open in new tab
    window.open(resource.fileUrl, '_blank');
  };

  const refreshResources = async () => {
    setLoading(true);
    try {
      const courseIds = enrolledCourses.map(course => course.courseId);
      let allResources = [];
      
      for (const courseId of courseIds) {
        const resourcesQuery = query(
          collection(db, 'courseMaterials'),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const courseResources = resourcesSnapshot.docs.map(doc => {
          const data = doc.data();
          const course = enrolledCourses.find(c => c.courseId === courseId);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            uploadedAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            courseName: course?.courseName || data.courseName || courseId,
            teacherName: data.teacherName || 'Teacher',
            type: data.fileType || data.type || getFileTypeFromUrl(data.downloadUrl),
            fileSize: data.fileSize || 0,
            downloads: data.downloads || 0,
            views: data.views || 0,
            title: data.title || 'Untitled Resource',
            description: data.description || '',
            fileUrl: data.downloadUrl || data.fileUrl
          };
        });
        
        allResources = [...allResources, ...courseResources];
      }
      
      setResources(allResources);
    } catch (error) {
      console.error('Error refreshing resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const uniqueCourses = Array.from(new Set(resources.map(r => r.courseId)))
    .map(courseId => {
      const resource = resources.find(r => r.courseId === courseId);
      return {
        id: courseId,
        name: resource?.courseName || courseId
      };
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
          <p className="text-gray-600 mt-1">
            Access course materials, documents, and study resources
          </p>
          {resources.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              No resources available yet. Check back later or contact your teacher.
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refreshResources}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
                disabled={uniqueCourses.length === 0}
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px]"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="presentation">Presentations</option>
                <option value="image">Images</option>
                <option value="audio">Audio Files</option>
                <option value="spreadsheet">Spreadsheets</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Banner - Only show if resources exist */}
        {resources.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl p-4 text-white mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredResources.length}</div>
                <div className="text-sm opacity-90">Total Resources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Set(filteredResources.map(r => r.courseId)).size}
                </div>
                <div className="text-sm opacity-90">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {filteredResources.reduce((total, r) => total + (r.downloads || 0), 0)}
                </div>
                <div className="text-sm opacity-90">Total Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatFileSize(filteredResources.reduce((total, r) => total + (r.fileSize || 0), 0))}
                </div>
                <div className="text-sm opacity-90">Total Size</div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Display */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Resources Found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCourse !== 'all' || filterType !== 'all'
                ? 'No resources match your current filters.'
                : 'No resources have been uploaded for your courses yet.'}
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg inline-block">
              <p className="text-sm text-gray-500">
                💡 Tip: Teachers upload materials to the "Course Materials" section.
                Check back later or contact your teacher.
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getFileColor(resource.type)}`}>
                      {getFileIcon(resource.type)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDownload(resource)}
                        disabled={downloading === resource.id}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Download"
                      >
                        {downloading === resource.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {resource.courseName}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getFileColor(resource.type)}`}>
                        {getFileTypeName(resource.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {resource.createdAt?.toLocaleDateString() || 'Recently'}
                      </span>
                      <span>{formatFileSize(resource.fileSize)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {resource.downloads || 0} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resource.views || 0} views
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleView(resource)}
                      className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                    <button 
                      onClick={() => handleDownload(resource)}
                      disabled={downloading === resource.id}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {downloading === resource.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getFileColor(resource.type)}`}>
                  {getFileIcon(resource.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 truncate">{resource.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getFileColor(resource.type)}`}>
                        {getFileTypeName(resource.type)}
                      </span>
                      <span className="text-xs text-gray-500">{formatFileSize(resource.fileSize)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                    {resource.description || 'No description available'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {resource.courseName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Uploaded: {resource.createdAt?.toLocaleDateString() || 'Recently'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {resource.downloads || 0} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {resource.views || 0} views
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleView(resource)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDownload(resource)}
                    disabled={downloading === resource.id}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    {downloading === resource.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recently Viewed</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recentlyViewed.slice(0, 5).map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${getFileColor(item.type)}`}>
                    {getFileIcon(item.type)}
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 truncate">{item.courseName}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResources;