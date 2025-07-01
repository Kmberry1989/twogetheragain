import React, { useState, useEffect, createContext, useContext } from 'react';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseContext } from './FirebaseContext';

export const CoupleContext = createContext(null);

export const CoupleProvider = ({ children }) => {
  const { db, userId, isAuthReady, appId, auth: firebaseAuthInstance } = useContext(FirebaseContext);
  const [coupleId, setCoupleId] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [loadingCouple, setLoadingCouple] = useState(true);
  const [errorCouple, setErrorCouple] = useState(null);

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !appId) { 
      if (isAuthReady && !db) { setLoadingCouple(false); }
      return;
    }
    setLoadingCouple(true);
    setErrorCouple(null);
    const couplesRef = collection(db, `artifacts/${appId}/public/data/couples`);
    const q1 = query(couplesRef, where("user1Id", "==", userId));
    const q2 = query(couplesRef, where("user2Id", "==", userId));
    let foundId = null;
    const checkAndSetCouple = (docId) => { if (!foundId) { foundId = docId; setCoupleId(docId); }};
    const unsub1 = onSnapshot(q1, (snapshot) => { if (!snapshot.empty) { checkAndSetCouple(snapshot.docs[0].id); } else if (!foundId) { setCoupleId(null); } if(loadingCouple) setLoadingCouple(false); }, (err) => { console.error("Query error (user1):", err); setErrorCouple("Failed to find couple."); setLoadingCouple(false); });
    const unsub2 = onSnapshot(q2, (snapshot) => { if (!snapshot.empty) { checkAndSetCouple(snapshot.docs[0].id); } else if (!foundId) { setCoupleId(null); } if(loadingCouple) setLoadingCouple(false); }, (err) => { console.error("Query error (user2):", err); setErrorCouple("Failed to find couple."); setLoadingCouple(false); });
    return () => { unsub1(); unsub2(); };
  }, [db, userId, isAuthReady, appId]);

  useEffect(() => {
    if (!db || !coupleId || !appId) { if (coupleId === null) { setCoupleData(null); } return; }
    const coupleDocRef = doc(db, `artifacts/${appId}/public/data/couples`, coupleId);
    const unsubscribeDoc = onSnapshot(coupleDocRef, (docSnap) => {
      if (docSnap.exists()) { setCoupleData({ id: docSnap.id, ...docSnap.data() }); } 
      else { setCoupleId(null); setCoupleData(null); }
      setLoadingCouple(false); 
    }, (err) => { console.error("Doc listen error:", err); setErrorCouple("Failed to load couple data."); setLoadingCouple(false); });
    return () => unsubscribeDoc();
  }, [db, coupleId, appId]);

  const createNewCouple = async (partnerIdInput) => {
    const partnerId = partnerIdInput.trim(); 
    if (!db || !userId || !appId) { setErrorCouple("Database not available."); return; }
    if (!partnerId) { setErrorCouple("Partner ID empty."); return; }
    if (partnerId === userId) { setErrorCouple("Cannot invite yourself. Use '0' for testing."); return; }
    setLoadingCouple(true); setErrorCouple(null);
    try {
      const couplesRef = collection(db, `artifacts/${appId}/public/data/couples`);
      let newCoupleData = { score: 0, currentActivityId: null, createdAt: serverTimestamp() };
      const currentUserDisplayName = firebaseAuthInstance?.currentUser?.displayName || "User";
      if (partnerId === "0") { 
        newCoupleData = { ...newCoupleData, user1Id: userId, user1DisplayName: `${currentUserDisplayName} (P1 Test)`, user2Id: userId, user2DisplayName: `${currentUserDisplayName} (P2 Test)`, status: "active_testing" };
      } else {
        const qPartnerCheck = query(couplesRef, where("user1Id", "in", [partnerId]), where("user2Id", "in", [partnerId]));
        const partnerSnap = await getDocs(qPartnerCheck);
        if (!partnerSnap.empty) { setErrorCouple("Partner already in a couple."); setLoadingCouple(false); return; }
        newCoupleData = { ...newCoupleData, user1Id: userId, user1DisplayName: currentUserDisplayName, user2Id: partnerId, user2DisplayName: "Partner 2 (Invited)", status: "pending_partner_join" };
      }
      const newCoupleDocRef = await addDoc(couplesRef, newCoupleData);
      setCoupleId(newCoupleDocRef.id); 
    } catch (err) { console.error("Create couple error:", err); setErrorCouple(`Failed to create: ${err.message}`); } 
    finally { setLoadingCouple(false); }
  };

  const joinExistingCouple = async (existingCoupleIdInput) => {
    const existingCoupleId = existingCoupleIdInput.trim();
    if (!db || !userId || !appId) { setErrorCouple("Database not available."); return; }
    if (!existingCoupleId) { setErrorCouple("Couple ID empty."); return; }
    setLoadingCouple(true); setErrorCouple(null);
    try {
      const coupleDocRef = doc(db, `artifacts/${appId}/public/data/couples`, existingCoupleId);
      const coupleSnap = await getDoc(coupleDocRef);
      if (coupleSnap.exists()) {
        const data = coupleSnap.data();
        if (data.user1Id === userId || data.user2Id === userId) { setErrorCouple("You are already in this couple."); setCoupleId(existingCoupleId); return; }
        const currentUserDisplayName = firebaseAuthInstance?.currentUser?.displayName || "User";
        if (!data.user1Id) { await updateDoc(coupleDocRef, { user1Id: userId, user1DisplayName: currentUserDisplayName, status: (data.user2Id ? "active" : "pending_partner_join") }); } 
        else if (!data.user2Id) { await updateDoc(coupleDocRef, { user2Id: userId, user2DisplayName: currentUserDisplayName, status: "active" }); } 
        else { setErrorCouple("Couple already full."); return; }
        setCoupleId(existingCoupleId); 
      } else { setErrorCouple("Couple ID not found."); }
    } catch (err) { console.error("Join couple error:", err); setErrorCouple(`Failed to join: ${err.message}`); } 
    finally { setLoadingCouple(false); }
  };

  const leaveCouple = async () => {
    if (!db || !userId || !coupleId || !coupleData || !appId) { setErrorCouple("Cannot leave: missing data."); return; }
    setLoadingCouple(true); setErrorCouple(null);
    try {
      const coupleDocRef = doc(db, `artifacts/${appId}/public/data/couples`, coupleId);
      const isUser1 = coupleData.user1Id === userId;
      const partner1SlotEmptyOrSelf = !coupleData.user1Id || coupleData.user1Id === userId;
      const partner2SlotEmptyOrSelf = !coupleData.user2Id || coupleData.user2Id === userId;
      if ((isUser1 && partner2SlotEmptyOrSelf) || (!isUser1 && partner1SlotEmptyOrSelf) || coupleData.status === "active_testing") {
        await deleteDoc(coupleDocRef);
      } else {
        const updates = { status: "pending_partner_join", currentActivityId: null };
        if (isUser1) { updates.user1Id = null; updates.user1DisplayName = null; } 
        else { updates.user2Id = null; updates.user2DisplayName = null; }
        await updateDoc(coupleDocRef, updates);
      }
      setCoupleId(null); setCoupleData(null); 
    } catch (err) { console.error("Leave couple error:", err); setErrorCouple(`Failed to leave: ${err.message}`); } 
    finally { setLoadingCouple(false); }
  };

  return ( <CoupleContext.Provider value={{ coupleId, coupleData, loadingCouple, errorCouple, createNewCouple, joinExistingCouple, leaveCouple }}> {children} </CoupleContext.Provider> );
};
