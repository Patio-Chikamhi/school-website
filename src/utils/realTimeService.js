// utils/realTimeService.js - FIXED VERSION
import { db } from '../firebase/config';
import { 
  collection, query, where, onSnapshot, 
  updateDoc, doc, serverTimestamp,
  orderBy, limit, getDocs, writeBatch
} from 'firebase/firestore';

class RealTimeService {
  constructor() {
    this.subscriptions = new Map();
    this.userId = null;
    this.userRole = null;
    this.studentId = null;
  }

  // Initialize with user
  initialize(user) {
    if (!user) return;
    
    this.userId = user.uid;
    this.userRole = user.role;
    this.studentId = user.studentId;
    
    console.log('RealTimeService initialized:', {
      userId: this.userId,
      role: this.userRole,
      studentId: this.studentId
    });
  }

  // Subscribe to notifications (FIXED - simpler query)
  subscribeToNotifications(callback) {
    if (!this.userId) {
      console.error('User not initialized');
      return () => {};
    }

    const key = `notifications_${this.userId}`;
    
    // Cleanup existing subscription
    if (this.subscriptions.has(key)) {
      this.unsubscribe(key);
    }

    let q;
    
    // Simple query that works with security rules
    if (this.userRole === 'student' && this.studentId) {
      q = query(
        collection(db, 'notifications'),
        where('studentId', '==', this.studentId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else if (this.userRole === 'teacher') {
      q = query(
        collection(db, 'notifications'),
        where('teacherId', '==', this.userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else if (this.userRole === 'admin') {
      q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      // Default for other roles
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          read: doc.data().read || false
        }));
        callback(notifications);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
      }
    );

    this.subscriptions.set(key, unsubscribe);
    return () => this.unsubscribe(key);
  }

  // Subscribe to assignments
  subscribeToAssignments(callback) {
    if (!this.userId || this.userRole !== 'student') {
      return () => {};
    }

    const key = `assignments_${this.userId}`;
    
    // Get student's courses first
    this.getStudentCourses().then(courseIds => {
      if (courseIds.length === 0) {
        callback([]);
        return;
      }
      
      const q = query(
        collection(db, 'assignments'),
        where('courseId', 'in', courseIds.slice(0, 10)),
        orderBy('dueDate', 'asc'),
        limit(30)
      );
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const assignments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dueDate: data.dueDate?.toDate(),
              createdAt: data.createdAt?.toDate()
            };
          });
          callback(assignments);
        },
        (error) => {
          console.error('Error in assignments subscription:', error);
        }
      );
      
      this.subscriptions.set(key, unsubscribe);
    });
    
    return () => this.unsubscribe(key);
  }

  // Subscribe to grades
  subscribeToGrades(callback) {
    if (!this.userId) return () => {};
    
    const key = `grades_${this.userId}`;
    
    let q;
    
    if (this.userRole === 'student') {
      q = query(
        collection(db, 'grades'),
        where('studentId', '==', this.studentId || this.userId),
        orderBy('gradedAt', 'desc'),
        limit(20)
      );
    } else if (this.userRole === 'teacher') {
      q = query(
        collection(db, 'grades'),
        where('teacherId', '==', this.userId),
        orderBy('gradedAt', 'desc'),
        limit(30)
      );
    } else {
      return () => {};
    }
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const grades = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          gradedAt: doc.data().gradedAt?.toDate()
        }));
        callback(grades);
      },
      (error) => {
        console.error('Error in grades subscription:', error);
      }
    );
    
    this.subscriptions.set(key, unsubscribe);
    return () => this.unsubscribe(key);
  }

  // Subscribe to course materials
  subscribeToCourseMaterials(courseIds, callback) {
    if (!courseIds || courseIds.length === 0) {
      callback([]);
      return () => {};
    }

    const key = `materials_${courseIds.join('_')}`;
    
    const q = query(
      collection(db, 'courseMaterials'),
      where('courseId', 'in', courseIds.slice(0, 10)),
      orderBy('uploadedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const materials = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate()
        }));
        callback(materials);
      },
      (error) => {
        console.error('Error in materials subscription:', error);
      }
    );

    this.subscriptions.set(key, unsubscribe);
    return () => this.unsubscribe(key);
  }

  // Helper method to get student courses
  async getStudentCourses() {
    if (!this.studentId && this.userRole !== 'student') {
      return [];
    }

    try {
      const q = query(
        collection(db, 'enrollments'),
        where('studentId', '==', this.studentId || this.userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().courseId);
    } catch (error) {
      console.error('Error getting student courses:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('studentId', '==', this.studentId || this.userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe
  unsubscribe(key) {
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)();
      this.subscriptions.delete(key);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  reset() {
    this.unsubscribeAll();
    this.userId = null;
    this.userRole = null;
    this.studentId = null;
  }
}

// Singleton instance
export const realTimeService = new RealTimeService();