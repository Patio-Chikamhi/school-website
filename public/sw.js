// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js');

// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon || '/logo.png',
    badge: '/badge.png',
    data: payload.data || {},
    tag: payload.data?.type || 'general'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event.notification);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});