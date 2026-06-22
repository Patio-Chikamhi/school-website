import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const createNotification = async ({
  type,
  message,
  recipientId,
  recipientRole,
  relatedId,
  relatedType
}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      type,
      message,
      recipientId,
      recipientRole,
      relatedId,
      relatedType,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Notification created: ${message}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Common notification templates
export const Notifications = {
  // Student notifications
  assignmentAssigned: (studentId, assignmentTitle, courseName) => 
    createNotification({
      type: 'assignment',
      message: `New assignment: ${assignmentTitle} in ${courseName}`,
      recipientId: studentId,
      recipientRole: 'student',
      relatedType: 'assignment'
    }),
  
  gradePosted: (studentId, assignmentTitle, grade) =>
    createNotification({
      type: 'grade',
      message: `Grade posted for ${assignmentTitle}: ${grade}`,
      recipientId: studentId,
      recipientRole: 'student',
      relatedType: 'grade'
    }),
  
  attendanceMarked: (studentId, date, status) =>
    createNotification({
      type: 'attendance',
      message: `Attendance marked for ${date}: ${status}`,
      recipientId: studentId,
      recipientRole: 'student',
      relatedType: 'attendance'
    }),
  
  // Teacher notifications
  teacherApproved: (teacherId) =>
    createNotification({
      type: 'approval',
      message: 'Your teacher account has been approved!',
      recipientId: teacherId,
      recipientRole: 'teacher',
      relatedType: 'account'
    }),
  
  newStudentEnrolled: (teacherId, studentName, courseName) =>
    createNotification({
      type: 'enrollment',
      message: `${studentName} has enrolled in ${courseName}`,
      recipientId: teacherId,
      recipientRole: 'teacher',
      relatedType: 'enrollment'
    }),
  
  // Admin notifications
  newTeacherApplication: (adminId, teacherName) =>
    createNotification({
      type: 'application',
      message: `New teacher application from ${teacherName}`,
      recipientId: adminId,
      recipientRole: 'admin',
      relatedType: 'application'
    }),
  
  studentApplicationSubmitted: (adminId, studentName) =>
    createNotification({
      type: 'application',
      message: `New student application from ${studentName}`,
      recipientId: adminId,
      recipientRole: 'admin',
      relatedType: 'application'
    })
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};