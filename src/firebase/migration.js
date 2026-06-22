// migration.js - Run once in Firebase Console or local Node script
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase/config';

const migrateData = async () => {
  // Migrate announcements
  const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
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
  }

  // Migrate newsletters
  const newslettersSnapshot = await getDocs(collection(db, 'newsletters'));
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
  }

  console.log('Migration complete!');
};