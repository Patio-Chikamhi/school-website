// src/utils/passwordManager.js
import { auth, db } from '../firebase/config';
import { 
  sendPasswordResetEmail, 
  updatePassword, 
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * Send password reset email (Forgot Password)
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false
    });
    return { success: true, message: 'Password reset email sent successfully!' };
  } catch (error) {
    console.error('Reset password error:', error);
    let message = 'Failed to send reset email. ';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message += 'No account found with this email.';
        break;
      case 'auth/invalid-email':
        message += 'Please enter a valid email address.';
        break;
      case 'auth/too-many-requests':
        message += 'Too many requests. Please try again later.';
        break;
      default:
        message += error.message;
    }
    
    return { success: false, message };
  }
};

/**
 * Change user password (When logged in)
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password (min 6 chars)
 * @returns {Promise<object>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    // Re-authenticate user before changing password (security)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    // Update Firestore to track password change
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      passwordLastChanged: serverTimestamp(),
      mustChangePassword: false,
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      message: 'Password changed successfully! Please login again.' 
    };
  } catch (error) {
    console.error('Change password error:', error);
    let message = 'Failed to change password. ';
    
    switch (error.code) {
      case 'auth/wrong-password':
        message += 'Current password is incorrect.';
        break;
      case 'auth/weak-password':
        message += 'New password should be at least 6 characters.';
        break;
      case 'auth/too-many-requests':
        message += 'Too many failed attempts. Please try again later.';
        break;
      default:
        message += error.message;
    }
    
    return { success: false, message };
  }
};

/**
 * Force password change on first login
 * @returns {boolean} - Whether user must change password
 */
export const mustChangePassword = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.mustChangePassword === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking password change requirement:', error);
    return false;
  }
};

/**
 * Send email verification
 * @returns {Promise<object>}
 */
export const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await sendEmailVerification(user);
    return { success: true, message: 'Verification email sent!' };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check if email is verified
 * @returns {boolean}
 */
export const isEmailVerified = () => {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
};