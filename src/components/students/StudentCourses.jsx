import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Video,
  Download,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Award,
  BarChart3,
  ExternalLink,
  FolderOpen,
  Bookmark,
  Star
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const StudentCourses = ({ studentId, enrolledCourses }) => {
  const [courses, setCourses] = useState([]);
  const [courseMaterials, setCourseMaterials] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // If we have enrolled courses, fetch their details
        if (enrolledCourses.length > 0) {
          const courseIds = enrolledCourses.map(course => course.courseId);
          
          // Fetch course details
          const coursesQuery = query(
            collection(db, 'courses'),
            where('id', 'in', courseIds.slice(0, 10)) // Firestore limit for 'in' queries
          );
          
          const coursesSnapshot = await getDocs(coursesQuery);
          const courseDetails = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Combine with enrollment data
          const enrichedCourses = enrolledCourses.map(enrollment => {
            const courseDetail = courseDetails.find(c => c.id === enrollment.courseId);
            return {
              ...enrollment,
              ...courseDetail,
              teacherName: enrollment.teacherName || courseDetail?.teacherName || 'TBA',
              schedule: courseDetail?.schedule || enrollment.schedule,
              materials: []
            };
          });
          
          setCourses(enrichedCourses);
          
          // Fetch materials for each course
          const materialsByCourse = {};
          for (const course of enrichedCourses) {
            const materialsQuery = query(
              collection(db, 'courseMaterials'),
              where('courseId', '==', course.courseId),
              orderBy('uploadedAt', 'desc'),
              where('visibleToStudents', '==', true)
            );
            
            const materialsSnapshot = await getDocs(materialsQuery);
            materialsByCourse[course.courseId] = materialsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              uploadedAt: doc.data().uploadedAt?.toDate()
            }));
          }
          
          setCourseMaterials(materialsByCourse);
        }
        
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [enrolledCourses]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'withMaterials' && courseMaterials[course.courseId]?.length > 0) return matchesSearch;
    if (filter === 'active') return matchesSearch && course.status === 'active';
    
    return matchesSearch;
  });

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'video': return '🎬';
      case 'document': return '📝';
      case 'presentation': return '📊';
      case 'image': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} enrolled this semester
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <option value="all">All Courses</option>
              <option value="withMaterials">With Materials</option>
              <option value="active">Active</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'No courses match your search. Try a different search term.' : 'You are not enrolled in any courses yet.'}
          </p>
          <button className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            Browse Available Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isExpanded = expandedCourse === course.id;
            const materials = courseMaterials[course.courseId] || [];
            
            return (
              <div 
                key={course.id} 
                className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md ${
                  isExpanded ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                {/* Course Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 truncate">{course.courseName}</h3>
                          <p className="text-sm text-gray-500">{course.courseId}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{course.teacherName || 'Teacher TBA'}</span>
                        </div>
                        
                        {course.schedule && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{course.schedule.days} • {course.schedule.time}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award className="w-4 h-4" />
                          <span>Grade {course.grade || 'All'} • {course.credits || 1} credit{course.credits !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Course Status */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        {course.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {materials.length} material{materials.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Expanded Content - Course Materials */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Course Materials</h4>
                      <span className="text-sm text-gray-500">{materials.length} files</span>
                    </div>
                    
                    {materials.length === 0 ? (
                      <div className="text-center py-6">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No materials uploaded yet</p>
                        <p className="text-sm text-gray-400 mt-1">Check back later for course resources</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {materials.slice(0, 3).map((material) => (
                          <div key={material.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                            <div className="text-2xl">{getFileIcon(material.type)}</div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 truncate">{material.title}</h5>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>Uploaded: {material.uploadedAt?.toLocaleDateString() || 'Recently'}</span>
                                <span>•</span>
                                <span>{formatFileSize(material.fileSize || 0)}</span>
                              </div>
                            </div>
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        ))}
                        
                        {materials.length > 3 && (
                          <button className="w-full text-sm text-emerald-600 hover:text-emerald-800 font-medium py-2 hover:bg-emerald-50 rounded-lg transition-colors">
                            View All {materials.length} Materials
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Course Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                        <Video className="w-4 h-4" />
                        Join Class
                      </button>
                      <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        View Grades
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{courses.length}</div>
            <div className="text-sm opacity-90">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {Object.values(courseMaterials).reduce((total, materials) => total + materials.length, 0)}
            </div>
            <div className="text-sm opacity-90">Total Materials</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {courses.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm opacity-90">Active Courses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">4.8</div>
            <div className="text-sm opacity-90">Avg. Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;