// run-migration.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

// Your Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDFCZz1oMMm6SbHgKiVJPtd9Ztqj8E45SM",
  authDomain: "school-website-db.firebaseapp.com",
  projectId: "school-website-db",
  storageBucket: "school-website-db.firebasestorage.app",
  messagingSenderId: "649146280286",
  appId: "1:649146280286:web:e2871d65ee2fce290207cf",
  measurementId: "G-V3E497D0ES"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrateData = async () => {
  try {
    console.log('Starting migration...');

    // First, check if we already have posts
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    if (postsSnapshot.size > 0) {
      console.log(`Posts collection already has ${postsSnapshot.size} documents.`);
      console.log('Would you like to continue anyway? This may create duplicates.');
      // You can add a prompt here or just continue
    }

    // Migrate announcements
    console.log('Fetching announcements...');
    const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
    console.log(`Found ${announcementsSnapshot.size} announcements to migrate`);
    
    let annCount = 0;
    for (const annDoc of announcementsSnapshot.docs) {
      const data = annDoc.data();
      await setDoc(doc(db, 'posts', `ann_${annDoc.id}`), {
        ...data,
        type: 'post',
        category: 'announcement',
        date: data.publishDate || data.date || new Date(),
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date()
      });
      annCount++;
      console.log(`Migrated announcement ${annCount}/${announcementsSnapshot.size}: ${annDoc.id}`);
    }

    // Migrate newsletters
    console.log('Fetching newsletters...');
    const newslettersSnapshot = await getDocs(collection(db, 'newsletters'));
    console.log(`Found ${newslettersSnapshot.size} newsletters to migrate`);
    
    let newsCount = 0;
    for (const newsDoc of newslettersSnapshot.docs) {
      const data = newsDoc.data();
      await setDoc(doc(db, 'posts', `news_${newsDoc.id}`), {
        ...data,
        type: 'post',
        category: 'newsletter',
        date: data.publishDate || data.date || new Date(),
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date(),
        isMonthly: data.isMonthly || false,
        issue: data.issue || `Issue ${new Date().getMonth() + 1}`
      });
      newsCount++;
      console.log(`Migrated newsletter ${newsCount}/${newslettersSnapshot.size}: ${newsDoc.id}`);
    }

    console.log('\n=================================');
    console.log('Migration complete!');
    console.log(`Total announcements migrated: ${annCount}`);
    console.log(`Total newsletters migrated: ${newsCount}`);
    console.log(`Total posts in collection: ${annCount + newsCount}`);
    console.log('=================================');
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
  }
};

// Run the migration
migrateData();