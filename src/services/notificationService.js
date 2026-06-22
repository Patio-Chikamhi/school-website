// services/notificationService.js - FIREBASE-ONLY VERSION
import { realTimeService } from '../utils/realTimeService';

class NotificationService {
  constructor() {
    this.permissionGranted = false;
    this.initialize();
  }

  async initialize() {
    this.permissionGranted = await this.requestPermission();
    this.setupListeners();
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  setupListeners() {
    // Listen for new notifications from Firestore
    // (Handled by realTimeService.subscribeToNotifications)
  }

  showBrowserNotification(title, options = {}) {
    if (this.permissionGranted) {
      const notification = new Notification(title, {
        icon: '/logo.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.url) window.location.href = options.url;
      };

      return notification;
    }
    return null;
  }

  // Show notification for new assignment
  showAssignmentNotification(assignment) {
    this.showBrowserNotification('New Assignment', {
      body: assignment.title,
      icon: '/icons/assignment.png',
      data: { url: `/student/assignments/${assignment.id}` }
    });
  }

  // Show notification for new grade
  showGradeNotification(grade) {
    this.showBrowserNotification('Grade Updated', {
      body: `${grade.assignmentName}: ${grade.percentage || grade.gradeValue}%`,
      icon: '/icons/grade.png',
      data: { url: '/student/grades' }
    });
  }

  // Show assignment reminder
  showAssignmentReminder(assignment) {
    const hoursLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 24 && hoursLeft > 0) {
      this.showBrowserNotification('Assignment Due Soon', {
        body: `${assignment.title} is due in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`,
        icon: '/icons/clock.png',
        data: { url: `/student/assignments/${assignment.id}` }
      });
    }
  }
}

export const notificationService = new NotificationService();