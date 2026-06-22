// src/utils/emailNotifications.js
export const sendTeacherStatusEmail = async (teacherEmail, status, teacherName, adminNotes = '') => {
    // This is a template - integrate with your email service (SendGrid, AWS SES, etc.)
    const emailTemplates = {
      pending: {
        subject: 'Your Teacher Application Has Been Received',
        body: `Dear ${teacherName}, your application has been received and is under review.`
      },
      approved: {
        subject: 'Congratulations! Your Teacher Application Has Been Approved',
        body: `Dear ${teacherName}, your application has been approved. Please log in to complete your profile setup.`
      },
      active: {
        subject: 'Your Teacher Account is Now Active',
        body: `Dear ${teacherName}, your account has been activated and courses have been assigned. You can now access your teacher dashboard.`
      },
      rejected: {
        subject: 'Update on Your Teacher Application',
        body: `Dear ${teacherName}, after careful consideration, we're unable to proceed with your application. ${adminNotes}`
      }
    };
  
    const template = emailTemplates[status];
    
    // Here you would integrate with your email service
    console.log('Would send email:', {
      to: teacherEmail,
      subject: template.subject,
      body: template.body
    });
  
    // Example with fetch if you have a backend:
    /*
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: teacherEmail,
        subject: template.subject,
        html: template.body
      })
    });
    */
  };