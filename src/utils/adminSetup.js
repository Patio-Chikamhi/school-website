import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const setupAdminUsers = async () => {
  try {
    // Get all existing users to check
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log('🔄 Setting up admin users...');
    
    // Pre-defined admin/teacher users (from your Firestore data)
    const predefinedUsers = [
      {
        email: 'admin@school.edu',
        name: 'School Administrator',
        role: 'admin',
        department: 'administration',
        phone: '91 233 233',
        isActive: true
      },
      {
        email: 'teacher@school.edu',
        name: 'Sample Teacher', 
        role: 'teacher',
        department: 'mathematics',
        isActive: true
      }
    ];

    for (const userData of predefinedUsers) {
      // Check if user with this email already exists
      const userQuery = query(usersRef, where('email', '==', userData.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        console.log(`⚠️ User ${userData.email} not found in Firestore`);
        console.log(`   Create this user through Firebase Authentication first`);
      } else {
        // Update existing user with correct role
        const userDoc = userSnapshot.docs[0];
        const currentData = userDoc.data();
        
        if (currentData.role !== userData.role) {
          await setDoc(doc(db, 'users', userDoc.id), {
            ...currentData,
            role: userData.role,
            updatedAt: new Date()
          }, { merge: true });
          console.log(`✅ Updated ${userData.email} to ${userData.role} role`);
        } else {
          console.log(`✓ ${userData.email} already has ${userData.role} role`);
        }
      }
    }
    
    console.log('✅ Admin setup complete');
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
  }
};

// Helper function to manually fix a user's role
export const fixUserRole = async (email, role) => {
  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await setDoc(doc(db, 'users', userDoc.id), {
        role: role,
        updatedAt: new Date()
      }, { merge: true });
      console.log(`✅ Set ${email} to ${role} role`);
      return true;
    } else {
      console.log(`❌ User ${email} not found in Firestore`);
      return false;
    }
  } catch (error) {
    console.error('Error fixing user role:', error);
    return false;
  }
};