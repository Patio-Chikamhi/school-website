// SendAnnouncementModal.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  X, Megaphone, Send, AlertCircle, Loader, Check, 
  BookOpen, Users, FileText, ChevronDown, Mail
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  collection, addDoc, serverTimestamp, query, 
  where, getDocs, doc, setDoc, updateDoc, arrayUnion
} from 'firebase/firestore';

const SendAnnouncementModal = ({ teacherId, teacherName, courses, enrolledStudents, onClose }) => {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sendTo, setSendTo] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalRecipients, setTotalRecipients] = useState(0);
  
  // Calculate total recipients
  useEffect(() => {
    let total = 0;
    
    if (sendTo === 'all' || sendTo === 'students') {
      selectedCourses.forEach(courseId => {
        total += enrolledStudents[courseId]?.length || 0;
      });
    }
    
    if (sendTo === 'all' || sendTo === 'parents') {
      selectedCourses.forEach(courseId => {
        total += enrolledStudents[courseId]?.length || 0;
      });
    }
    
    setTotalRecipients(total);
  }, [selectedCourses, sendTo, enrolledStudents]);
  
  const handleSendAnnouncement = async () => {
    if (selectedCourses.length === 0) {
      setError('Please select at least one course');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for the announcement');
      return;
    }
    
    if (!message.trim()) {
      setError('Please enter a message for the announcement');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Create main announcement document
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        senderId: teacherId,
        senderName: teacherName,
        senderRole: 'teacher',
        courses: selectedCourses,
        sendTo: sendTo,
        recipientsCount: totalRecipients,
        status: 'sent',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const announcementRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      let successCount = 0;
      
      // Process each selected course
      for (const courseId of selectedCourses) {
        const courseStudents = enrolledStudents[courseId] || [];
        
        // Get course details
        const courseRef = doc(db, 'courses', courseId);
        const courseDoc = await getDocs(query(collection(db, 'courses'), where('id', '==', courseId)));
        let courseName = 'Unknown Course';
        if (!courseDoc.empty) {
          courseName = courseDoc.docs[0].data().courseName || courseName;
        }
        
        for (const student of courseStudents) {
          // Send to students
          if (sendTo === 'all' || sendTo === 'students') {
            // Find student document by studentId
            const studentQuery = query(
              collection(db, 'students'),
              where('studentId', '==', student.studentId)
            );
            
            const studentSnapshot = await getDocs(studentQuery);
            if (!studentSnapshot.empty) {
              const studentDoc = studentSnapshot.docs[0];
              const studentRef = doc(db, 'students', studentDoc.id);
              
              // Create a unique ID for this announcement for this student
              const studentAnnouncementId = `${announcementRef.id}`;
              const studentAnnouncementRef = doc(db, 'students', studentDoc.id, 'announcements', studentAnnouncementId);
              
              await setDoc(studentAnnouncementRef, {
                announcementId: announcementRef.id,
                title: announcementData.title,
                message: announcementData.message,
                priority: announcementData.priority,
                senderName: announcementData.senderName,
                courseId: courseId,
                courseName: courseName,
                read: false,
                receivedAt: serverTimestamp(),
                type: 'announcement'
              });
              
              // Also update the student's main document with a reference (optional)
              await updateDoc(studentRef, {
                lastAnnouncementAt: serverTimestamp(),
                unreadAnnouncements: arrayUnion(announcementRef.id)
              });
              
              successCount++;
            }
          }
          
          // Send to parents
          if (sendTo === 'all' || sendTo === 'parents') {
            if (student.parentEmail) {
              // Find parent by email
              const parentQuery = query(
                collection(db, 'users'),
                where('email', '==', student.parentEmail),
                where('role', '==', 'parent')
              );
              
              const parentSnapshot = await getDocs(parentQuery);
              if (!parentSnapshot.empty) {
                const parentDoc = parentSnapshot.docs[0];
                const parentAnnouncementRef = doc(db, 'users', parentDoc.id, 'announcements', announcementRef.id);
                
                await setDoc(parentAnnouncementRef, {
                  announcementId: announcementRef.id,
                  title: announcementData.title,
                  message: announcementData.message,
                  priority: announcementData.priority,
                  senderName: announcementData.senderName,
                  studentName: student.studentName || student.fullName || 'Student',
                  studentId: student.studentId,
                  courseId: courseId,
                  courseName: courseName,
                  read: false,
                  receivedAt: serverTimestamp(),
                  type: 'announcement'
                });
                
                successCount++;
              }
            }
          }
        }
        
        // Store in course announcements subcollection for course-wide visibility
        const courseAnnouncementRef = doc(db, 'courses', courseId, 'announcements', announcementRef.id);
        await setDoc(courseAnnouncementRef, {
          announcementId: announcementRef.id,
          title: announcementData.title,
          message: announcementData.message,
          priority: announcementData.priority,
          senderName: announcementData.senderName,
          senderId: teacherId,
          sentAt: serverTimestamp(),
          type: 'announcement'
        });
      }
      
      setSuccess(`✅ Announcement sent successfully to ${successCount} recipient(s)!`);
      
      // Reset form after success
      setTimeout(() => {
        setTitle('');
        setMessage('');
        setSelectedCourses([]);
        setPriority('normal');
        setSendTo('all');
      }, 3000);
      
    } catch (err) {
      console.error('Error sending announcement:', err);
      setError(`❌ Error sending announcement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };
  
  const selectAllCourses = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map(course => course.id));
    }
  };
  
  const getPriorityColor = (priorityValue) => {
    switch (priorityValue) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Announcement</h2>
            <p className="text-sm text-gray-500">Communicate with your students and parents</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Course Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Courses *
                </label>
                <button
                  type="button"
                  onClick={selectAllCourses}
                  className="text-sm text-emerald-600 hover:text-emerald-800"
                >
                  {selectedCourses.length === courses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.map(course => {
                  const isSelected = selectedCourses.includes(course.id);
                  const studentCount = enrolledStudents[course.id]?.length || 0;
                  
                  return (
                    <div
                      key={course.id}
                      onClick={() => toggleCourse(course.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-300 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                          <p className="text-sm text-gray-600">
                            {studentCount} student{studentCount !== 1 ? 's' : ''} enrolled
                          </p>
                        </div>
                        <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Announcement Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Field Trip Permission Slips Due"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="6"
                  placeholder="Enter your announcement message here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send To
                  </label>
                  <select
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">Students & Parents</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Announcement Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{selectedCourses.length}</div>
                  <div className="text-sm text-gray-600">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalRecipients}</div>
                  <div className="text-sm text-gray-600">Recipients</div>
                </div>
                <div className="text-center">
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{
                    backgroundColor: priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef3c7' : '#dbeafe',
                    color: priority === 'high' ? '#991b1b' : priority === 'medium' ? '#92400e' : '#1e40af'
                  }}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {sendTo === 'all' ? 'All' : sendTo === 'students' ? 'Students' : 'Parents'}
                  </div>
                  <div className="text-sm text-gray-600">Audience</div>
                </div>
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSendAnnouncement}
                disabled={loading || selectedCourses.length === 0 || !title.trim() || !message.trim()}
                className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Announcement ({totalRecipients} recipients)
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendAnnouncementModal;