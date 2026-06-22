import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Main function to sync user role from Firestore
export const syncUserRole = async (userId, userEmail) => {
  try {
    // Method 1: Try to get user document by UID first
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`✅ Found user by UID: ${userData.email} with role: ${userData.role}`);
      return userData.role || 'user';
    }
    
    // Method 2: If not found by UID, search by email
    if (userEmail) {
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', userEmail));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        const emailUserData = emailSnapshot.docs[0].data();
        console.log(`✅ Found user by email: ${userEmail} with role: ${emailUserData.role}`);
        
        // Update the user document with the correct UID
        await setDoc(doc(db, 'users', userId), {
          ...emailUserData,
          uid: userId, // Ensure UID is set
          updatedAt: new Date()
        }, { merge: true });
        
        return emailUserData.role || 'user';
      }
    }
    
    // Method 3: Default role for new users
    console.log(`🆕 New user ${userEmail || userId} - assigning default 'user' role`);
    return 'user';
    
  } catch (error) {
    console.error('Error syncing user role:', error);
    return 'user'; // Default on error
  }
};

// Function to get all users with their roles (for admin view)
export const getAllUsersWithRoles = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};