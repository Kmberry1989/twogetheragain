import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { CoupleContext } from '../contexts/CoupleContext';
import { doc, updateDoc, addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { HomeIcon, DiceIcon, PenToolIcon, MicIcon, Music2Icon, MessageSquareIcon } from '../components/Icons';

// Import all activity components
import { CoinTossActivity } from '../activities/CoinTossActivity';
import { CollaborativeWritingActivity } from '../activities/CollaborativeWritingActivity';
import { SongCreationActivity } from '../activities/SongCreationActivity';
import { DuetHarmoniesMeasuresActivity } from '../activities/DuetHarmoniesMeasuresActivity';
import { ScriptedScenesActivity } from '../activities/ScriptedScenesActivity';


const allActivitiesList = [
    { id: 'coin-toss', name: 'Coin Toss Challenge', component: CoinTossActivity, icon: DiceIcon, description: "A quick 3D coin toss!" },
    { id: 'collaborative-story', name: 'Our Story Unfolds', component: CollaborativeWritingActivity, icon: PenToolIcon, description: "Build a unique story together." },
    { id: 'song-creation', name: 'Duet Harmonies (Original)', component: SongCreationActivity, icon: MicIcon, description: "Record audio layers for a song." },
    { id: 'duet-harmonies-measures', name: 'Duet Harmonies (Measures)', component: DuetHarmoniesMeasuresActivity, icon: Music2Icon, description: "Layer short musical measures." },
    { id: 'scripted-scenes', name: 'Scripted Scenes', component: ScriptedScenesActivity, icon: MessageSquareIcon, description: "Voice act a script together." },
];

const ActivitiesPage = ({ onNavigate }) => {
  const { db, userId, appId } = useContext(FirebaseContext);
  const { coupleId, coupleData } = useContext(CoupleContext);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false); 
  const [activityError, setActivityError] = useState(null);

 useEffect(() => {
    if (!db || !coupleId || !coupleData || !appId) { setCurrentActivity(null); return; }
    if (coupleData.currentActivityId) {
        setLoadingActivity(true); 
        const activityDocRef = doc(db, `artifacts/${appId}/public/data/activities`, coupleData.currentActivityId);
        const unsubscribeActivity = onSnapshot(activityDocRef, (docSnap) => {
            if (docSnap.exists()) { setCurrentActivity({ id: docSnap.id, ...docSnap.data() }); }
            else { setCurrentActivity(null); if (coupleData.currentActivityId) { updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), { currentActivityId: null }).catch(err => console.error("Error clearing activityId:", err)); }}
            setLoadingActivity(false);
        }, (err) => { console.error("Error listening to activity:", err); setActivityError("Failed to load activity."); setCurrentActivity(null); setLoadingActivity(false); });
        return () => unsubscribeActivity();
    } else { setCurrentActivity(null); setLoadingActivity(false); }
}, [db, coupleId, coupleData?.currentActivityId, appId, coupleData]);

  const startRandomActivity = async () => {
    if (!db || !coupleId || loadingActivity || !coupleData || !appId) { setActivityError("Cannot start: missing data or busy."); return; }
    if (coupleData.currentActivityId) { setActivityError("Activity already in progress."); return; }
    if (coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id) ) { setActivityError("Both partners needed."); return; }

    setLoadingActivity(true); setActivityError(null);
    try {
      const randomActivityDetails = allActivitiesList[Math.floor(Math.random() * allActivitiesList.length)];
      const initialTurn = Math.random() < 0.5 ? coupleData.user1Id : coupleData.user2Id;
      let initialActivityData = { suggestionsLog: [], turnHistory: [] };
      if (randomActivityDetails.id === 'collaborative-story') { const prompts = ["Once upon a time...", "The old house..."]; initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)]; initialActivityData.currentText = initialActivityData.prompt + "\n"; } 
      else if (randomActivityDetails.id === 'duet-harmonies-measures') { const prompts = ["Rainy Day Groove", "Sunrise Serenity"]; initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)]; initialActivityData.tempo = 120; initialActivityData.measures = 2; initialActivityData.secondsPerLoop = (60 / initialActivityData.tempo) * 4 * initialActivityData.measures; initialActivityData.layers = []; initialActivityData.maxLayersPerUser = 2; } 
      else if (randomActivityDetails.id === 'scripted-scenes') { const scenes = [ { prompt: "Pirate & Mermaid", script: [ { char: "Captain", line: "Arrr, treasure!" }, { char: "Mermaid", line: "Never!" } ] }, { prompt: "Squirrels & Acorn", script: [ { char: "Squeaky", line: "My acorn!" }, { char: "Nutsy", line: "No, mine!" } ] } ]; const selectedScene = scenes[Math.floor(Math.random() * scenes.length)]; initialActivityData.scenePrompt = selectedScene.prompt; initialActivityData.script = selectedScene.script.map(line => ({ ...line, recordedAudioData: null, voiceDirection: null })); initialActivityData.currentLineIndex = 0; initialActivityData.maxLines = selectedScene.script.length; }
      const newActivityDocRef = await addDoc(collection(db, `artifacts/${appId}/public/data/activities`), { type: randomActivityDetails.id, status: 'in-progress', turn: initialTurn, createdAt: serverTimestamp(), coupleId: coupleId, participants: [coupleData.user1Id, coupleData.user2Id].filter(id => id != null), data: initialActivityData });
      await updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), { currentActivityId: newActivityDocRef.id });
    } catch (err) { console.error("Error starting activity:", err); setActivityError(`Failed to start: ${err.message}`); } 
    finally { setLoadingActivity(false); }
  };

  const endCurrentActivity = async (activityResult = {}) => { 
    if (!db || !coupleId || !currentActivity || !appId || !coupleData) { setActivityError("Cannot end: missing data."); return; }
    setLoadingActivity(true); setActivityError(null);
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, currentActivity.id), { status: 'completed', completedAt: serverTimestamp(), result: activityResult });
      const activityDetails = allActivitiesList.find(a => a.id === currentActivity.type);
      await addDoc(collection(db, `artifacts/${appId}/public/data/journalEntries`), { coupleId: coupleId, activityId: currentActivity.id, activityType: currentActivity.type, activityName: activityDetails?.name || currentActivity.type, result: activityResult, timestamp: serverTimestamp(), userIds: [coupleData.user1Id, coupleData.user2Id].filter(id => id != null) });
      const scoreChange = activityResult.scoreChange || 0; const newScore = (coupleData?.score || 0) + scoreChange;
      await updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), { currentActivityId: null, score: newScore });
      setCurrentActivity(null); 
    } catch (err) { console.error("Error ending activity:", err); setActivityError(`Failed to end: ${err.message}`); } 
    finally { setLoadingActivity(false); }
  };

  const currentActivityDetails = currentActivity ? allActivitiesList.find(a => a.id === currentActivity.type) : null;
  const CurrentActivityComponent = currentActivityDetails ? currentActivityDetails.component : null;
  
  return ( <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 p-4 flex flex-col items-center"> <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl text-gray-800"> <div className="flex items-center justify-between mb-6"> <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Activities Hub</h1> <button onClick={() => onNavigate('home')} className="btn-secondary-sm"> <HomeIcon className="w-5 h-5 mr-2" /> Home </button> </div> {loadingActivity && !currentActivity && <p className="text-center text-blue-500 text-lg my-8 animate-pulse">Loading activity...</p>} {currentActivity && CurrentActivityComponent ? ( <div className="mt-6 p-4 sm:p-6 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50/50"> <div className="flex items-center mb-4"> {currentActivityDetails?.icon && <currentActivityDetails.icon className="w-8 h-8 text-teal-600 mr-3"/>} <h2 className="text-3xl font-semibold text-teal-700">{currentActivityDetails?.name || "Current Activity"}</h2> </div> <CurrentActivityComponent activity={currentActivity} onUpdateActivity={async (updatedData) => { if(db && currentActivity?.id && appId) { try { await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, currentActivity.id), { data: updatedData, lastUpdated: serverTimestamp(), turn: updatedData.turn || currentActivity.turn }); } catch (err) { console.error("Error updating activity:", err); setActivityError("Failed to save progress."); }}}} onEndActivity={endCurrentActivity} coupleData={coupleData} userId={userId} /> {activityError && <p className="text-center text-red-500 mt-4 p-2 bg-red-100 rounded">{activityError}</p>} </div> ) : ( <div className="mt-6 text-center"> <p className="text-xl mb-6 text-gray-600">No active adventure! Ready for a new one?</p> <button onClick={startRandomActivity} disabled={loadingActivity || !coupleId || !coupleData || (coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id))} className="btn-primary-lg"> {loadingActivity ? <span className="animate-pulse">Starting...</span> : 'Start Random Activity'} </button> {!coupleId && <p className="text-red-500 mt-3 text-sm">Please join/create a couple first.</p>} {coupleData && coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id) && <p className="text-orange-600 mt-3 text-sm">Waiting for partner.</p>} {activityError && <p className="text-red-500 mt-3 p-2 bg-red-100 rounded text-sm">{activityError}</p>} </div> )} </div> </div> );
};

export default ActivitiesPage;