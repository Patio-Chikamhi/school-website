const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ============ CUSTOM CLAIMS ============

exports.setCustomClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    try {
      const userId = context.params.userId;
      
      if (!change.after.exists) {
        console.log(`User ${userId} document deleted`);
        try {
          await admin.auth().setCustomUserClaims(userId, null);
        } catch (error) {
          console.error('Error removing custom claims:', error);
        }
        return null;
      }
      
      const userData = change.after.data();
      console.log(`Setting custom claims for ${userId}:`, {
        role: userData.role,
        status: userData.status,
        studentId: userData.studentId,
        teacherId: userData.teacherId
      });
      
      await admin.auth().setCustomUserClaims(userId, {
        role: userData.role || 'user',
        status: userData.status || 'inactive',
        studentId: userData.studentId || null,
        teacherId: userData.teacherId || null
      });
      
      console.log(`✅ Custom claims set for ${userId}`);
      
    } catch (error) {
      console.error('❌ Error setting custom claims:', error);
      return null;
    }
  });

// ============ REAL-TIME TRIGGERS ============

exports.onAssignmentCreated = functions.firestore
  .document('assignments/{assignmentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const assignment = snapshot.data();
      console.log(`New assignment: ${assignment.title}`);
      
      // Get enrolled students
      const enrollments = await admin.firestore()
        .collection('enrollments')
        .where('courseId', '==', assignment.courseId)
        .where('status', '==', 'active')
        .get();
      
      if (enrollments.empty) {
        console.log('No students enrolled in this course');
        return null;
      }
      
      // Create notifications
      const batch = admin.firestore().batch();
      const notificationsRef = admin.firestore().collection('notifications');
      
      enrollments.docs.forEach(enrollmentDoc => {
        const enrollment = enrollmentDoc.data();
        const notificationRef = notificationsRef.doc();
        
        batch.set(notificationRef, {
          studentId: enrollment.studentId,
          type: 'assignment',
          title: '📝 New Assignment',
          message: `${assignment.title} has been posted`,
          assignmentId: snapshot.id,
          courseId: assignment.courseId,
          courseName: assignment.courseName || 'Course',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          priority: 'high'
        });
      });
      
      await batch.commit();
      console.log(`Created ${enrollments.size} notifications`);
      
    } catch (error) {
      console.error('❌ Error in onAssignmentCreated:', error);
    }
  });

exports.onGradeUpdated = functions.firestore
  .document('grades/{gradeId}')
  .onCreate(async (snapshot, context) => {
    try {
      const grade = snapshot.data();
      console.log(`New grade for student ${grade.studentId}`);
      
      await admin.firestore().collection('notifications').add({
        studentId: grade.studentId,
        type: 'grade',
        title: '📊 Grade Updated',
        message: 'Your grade is now available',
        gradeId: snapshot.id,
        assignmentId: grade.assignmentId,
        courseId: grade.courseId,
        grade: grade.grade,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        priority: 'medium'
      });
      
    } catch (error) {
      console.error('❌ Error in onGradeUpdated:', error);
    }
  });

exports.onAttendanceRecorded = functions.firestore
  .document('attendance/{attendanceId}')
  .onCreate(async (snapshot, context) => {
    try {
      const attendance = snapshot.data();
      
      await admin.firestore().collection('notifications').add({
        studentId: attendance.studentId,
        type: 'attendance',
        title: '📅 Attendance Recorded',
        message: `Status: ${attendance.status}`,
        attendanceId: snapshot.id,
        courseId: attendance.courseId,
        status: attendance.status,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('❌ Error in onAttendanceRecorded:', error);
    }
  });

// Trigger for course materials
exports.onMaterialUploaded = functions.firestore
  .document('courseMaterials/{materialId}')
  .onCreate(async (snapshot, context) => {
    try {
      const material = snapshot.data();
      
      if (!material.visibleToStudents) return;
      
      // Get enrolled students
      const enrollments = await admin.firestore()
        .collection('enrollments')
        .where('courseId', '==', material.courseId)
        .where('status', '==', 'active')
        .get();
      
      if (enrollments.empty) return;
      
      const batch = admin.firestore().batch();
      const notificationsRef = admin.firestore().collection('notifications');
      
      enrollments.docs.forEach(enrollmentDoc => {
        const enrollment = enrollmentDoc.data();
        const notificationRef = notificationsRef.doc();
        
        batch.set(notificationRef, {
          studentId: enrollment.studentId,
          type: 'resource',
          title: '📚 New Material',
          message: material.title,
          materialId: snapshot.id,
          courseId: material.courseId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('❌ Error in onMaterialUploaded:', error);
    }
  });

// ============ API ENDPOINTS ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'evergreen-academy-api'
  });
});

// Generate upload URL for assignments
app.post('/api/generate-upload-url', async (req, res) => {
  try {
    const { studentId, assignmentId, fileName, fileType } = req.body;
    
    if (!studentId || !assignmentId || !fileName || !fileType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }
    
    // Generate file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `submissions/${studentId}/${assignmentId}/${timestamp}_${sanitizedFileName}`;
    
    // Generate signed URL (valid for 15 minutes)
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: fileType
    });
    
    res.json({
      success: true,
      uploadUrl: url,
      filePath,
      expiresIn: '15 minutes'
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete upload and create submission record
app.post('/api/complete-upload', async (req, res) => {
  try {
    const { filePath, studentId, assignmentId, fileName, fileType, fileSize } = req.body;
    
    if (!filePath || !studentId || !assignmentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create submission document
    await admin.firestore().collection('submissions').add({
      studentId,
      assignmentId,
      filePath,
      fileName,
      fileType,
      fileSize,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Notify teacher
    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(assignmentId)
      .get();
    
    if (assignmentDoc.exists) {
      const assignment = assignmentDoc.data();
      
      await admin.firestore().collection('notifications').add({
        teacherId: assignment.teacherId,
        type: 'submission',
        title: '📤 Assignment Submitted',
        message: `${studentId} submitted "${assignment.title}"`,
        studentId,
        assignmentId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ success: true, message: 'Submission recorded' });
    
  } catch (error) {
    console.error('Error completing upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics (for dashboard)
app.get('/api/stats', async (req, res) => {
  try {
    const [
      studentsCount,
      teachersCount,
      assignmentsCount,
      submissionsCount
    ] = await Promise.all([
      admin.firestore().collection('users').where('role', '==', 'student').count().get(),
      admin.firestore().collection('users').where('role', '==', 'teacher').count().get(),
      admin.firestore().collection('assignments').count().get(),
      admin.firestore().collection('submissions').count().get()
    ]);
    
    res.json({
      success: true,
      stats: {
        students: studentsCount.data().count,
        teachers: teachersCount.data().count,
        assignments: assignmentsCount.data().count,
        submissions: submissionsCount.data().count
      }
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export Express app
exports.api = functions.https.onRequest(app);

// ============ SCHEDULED FUNCTIONS ============

// Clean up old notifications daily
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldNotifications = await admin.firestore()
        .collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();
      
      if (oldNotifications.empty) {
        console.log('No old notifications to clean up');
        return null;
      }
      
      const batch = admin.firestore().batch();
      oldNotifications.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${oldNotifications.size} old notifications`);
      
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  });

// Send assignment reminders (runs every morning at 8 AM)
exports.sendAssignmentReminders = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Find assignments due tomorrow
      const assignments = await admin.firestore()
        .collection('assignments')
        .where('dueDate', '>=', new Date(tomorrowStr))
        .where('dueDate', '<', new Date(tomorrow.setDate(tomorrow.getDate() + 1)))
        .get();
      
      if (assignments.empty) {
        console.log('No assignments due tomorrow');
        return null;
      }
      
      const batch = admin.firestore().batch();
      const notificationsRef = admin.firestore().collection('notifications');
      
      assignments.docs.forEach(assignmentDoc => {
        const assignment = assignmentDoc.data();
        
        // Get enrolled students
        admin.firestore()
          .collection('enrollments')
          .where('courseId', '==', assignment.courseId)
          .where('status', '==', 'active')
          .get()
          .then(enrollments => {
            enrollments.docs.forEach(enrollmentDoc => {
              const enrollment = enrollmentDoc.data();
              const notificationRef = notificationsRef.doc();
              
              batch.set(notificationRef, {
                studentId: enrollment.studentId,
                type: 'reminder',
                title: '⏰ Assignment Due Tomorrow',
                message: `${assignment.title} is due tomorrow`,
                assignmentId: assignmentDoc.id,
                courseId: assignment.courseId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                priority: 'high'
              });
            });
          });
      });
      
      await batch.commit();
      console.log(`Sent ${assignments.size} assignment reminders`);
      
    } catch (error) {
      console.error('Error sending assignment reminders:', error);
    }
  });