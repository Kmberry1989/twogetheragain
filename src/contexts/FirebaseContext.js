import React, { useState, useEffect, createContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    initializeFirestore, 
    memoryLocalCache,
    enableIndexedDbPersistence 
} from 'firebase/firestore';

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appId, setAppId] = useState('');

  useEffect(() => {
    // Build the Firebase config from Vercel's Environment Variables
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

    // Check if the keys are present. If not, we can't initialize Firebase.
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn("Firebase config environment variables not set. App will run in offline/demo mode.");
        setIsAuthReady(true); 
        setAppId('default-app-id-no-firebase');
        return;
    }

    const initializedApp = initializeApp(firebaseConfig);
    
    // Initialize Firestore with robust persistence, falling back to memory cache
    const firestoreDb = initializeFirestore(initializedApp, {
        localCache: memoryLocalCache()
    });
    
    enableIndexedDbPersistence(firestoreDb)
      .then(() => console.log("Firestore offline persistence enabled."))
      .catch((err) => console.warn("Firestore persistence failed, will use memory cache:", err.message));


    const firebaseAuth = getAuth(initializedApp);

    setApp(initializedApp);
    setDb(firestoreDb);
    setAuth(firebaseAuth);

    const currentAppId = process.env.REACT_APP_TWOGETHER_APP_ID || 'twogether';
    setAppId(currentAppId);

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
          // Note: __initial_auth_token is for specific environments and might not be used on Vercel
          const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (error) {
          console.error("Error signing in:", error);
        }
      }
      setUserId(firebaseAuth.currentUser?.uid || `anon-${crypto.randomUUID()}`);
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <FirebaseContext.Provider value={{ app, db, auth, userId, isAuthReady, appId }}>
      {children}
    </FirebaseContext.Provider>
  );
};
