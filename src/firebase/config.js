// Firebase configuration with enhanced features
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyDFCZz1oMMm6SbHgKiVJPtd9Ztqj8E45SM",
    authDomain: "school-website-db.firebaseapp.com",
    projectId: "school-website-db",
    storageBucket: "school-website-db.firebasestorage.app",
    messagingSenderId: "649146280286",
    appId: "1:649146280286:web:e2871d65ee2fce290207cf",
    measurementId: "G-V3E497D0ES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging (only if in browser and supported)
let messaging = null;

if (typeof window !== 'undefined') {
    // Set auth persistence
    setPersistence(auth, browserLocalPersistence)
        .then(() => {
            console.log('Auth persistence enabled');
        })
        .catch((error) => {
            console.error('Error setting auth persistence:', error);
        });

    // Enable Firestore offline persistence
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log('Firestore offline persistence enabled');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
                console.warn('The current browser doesn\'t support persistence.');
            }
        });

    // Check if messaging is supported
    isSupported()
        .then((supported) => {
            if (supported) {
                messaging = getMessaging(app);
                console.log('Firebase Messaging initialized');
            } else {
                console.log('Firebase Messaging not supported in this browser');
            }
        })
        .catch((err) => {
            console.error('Error checking messaging support:', err);
        });
}

export { messaging, app };

// Helper function to check if user is authenticated
export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

// Helper function to get user token
export const getUserToken = async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken(true);
            return token;
        } catch (error) {
            console.error('Error getting user token:', error);
            return null;
        }
    }
    return null;
};

// Helper function to set up real-time listeners
export const setupFirestoreListener = (collectionPath, callback, queryOptions = {}) => {
    if (typeof window === 'undefined') return () => {};

    const collectionRef = db.collection(collectionPath);
    let queryRef = collectionRef;

    // Apply query options if provided
    if (queryOptions.where) {
        queryRef = queryRef.where(...queryOptions.where);
    }
    if (queryOptions.orderBy) {
        queryRef = queryRef.orderBy(...queryOptions.orderBy);
    }
    if (queryOptions.limit) {
        queryRef = queryRef.limit(queryOptions.limit);
    }

    const unsubscribe = queryRef.onSnapshot(
        (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(data);
        },
        (error) => {
            console.error(`Error listening to ${collectionPath}:`, error);
        }
    );

    return unsubscribe;
};