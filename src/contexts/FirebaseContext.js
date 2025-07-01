import React, { useState, useEffect, createContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appId, setAppId] = useState('');

  useEffect(() => {
    const firebaseConfigStr = typeof window.__firebase_config !== 'undefined' ? window.__firebase_config : '{}';
    const firebaseConfig = JSON.parse(firebaseConfigStr);

    if (Object.keys(firebaseConfig).length === 0) {
        console.warn("Firebase config not found. App will run in offline mode.");
        setIsAuthReady(true); 
        setAppId('default-app-id-no-firebase');
        return;
    }

    const initializedApp = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(initializedApp);
    
    (async () => {
        try {
            await enableIndexedDbPersistence(firestoreDb);
            console.log("Firestore offline persistence enabled.");
        } catch (err) {
            console.warn("Firestore persistence failed:", err.message);
        }
    })();

    const firebaseAuth = getAuth(initializedApp);

    setApp(initializedApp);
    setDb(firestoreDb);
    setAuth(firebaseAuth);

    const currentAppId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'twogether';
    setAppId(currentAppId);

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
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