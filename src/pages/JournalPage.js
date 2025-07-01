import React, { useState, useEffect, useContext, useRef } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { CoupleContext } from '../contexts/CoupleContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { HomeIcon, BookIcon, DiceIcon, PenToolIcon, MicIcon, Music2Icon, MessageSquareIcon, PlayIcon, StopCircleIcon } from '../components/Icons';

const allActivitiesList = [
    { id: 'coin-toss', name: 'Coin Toss Challenge', icon: DiceIcon },
    { id: 'collaborative-story', name: 'Our Story Unfolds', icon: PenToolIcon },
    { id: 'song-creation', name: 'Duet Harmonies (Original)', icon: MicIcon },
    { id: 'duet-harmonies-measures', name: 'Duet Harmonies (Measures)', icon: Music2Icon },
    { id: 'scripted-scenes', name: 'Scripted Scenes', icon: MessageSquareIcon },
];

const JournalPage = ({ onNavigate }) => {
  const { db, appId, userId: currentUserId } = useContext(FirebaseContext); 
  const { coupleId, coupleData } = useContext(CoupleContext); 
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournal, setLoadingJournal] = useState(true);
  const [journalError, setJournalError] = useState(null);

  const measureAudioPlayersRef = useRef({}); 
  const sceneAudioPlayerRef = useRef(null); 
  const [currentPlayingSceneInfo, setCurrentPlayingSceneInfo] = useState({ entryId: null, lineIndex: -1 }); 
  const [isPlayingScene, setIsPlayingScene] = useState(false);

  useEffect(() => {
    if (!db || !coupleId || !appId) { setLoadingJournal(false); return; }
    setLoadingJournal(true); setJournalError(null);
    const q = query( collection(db, `artifacts/${appId}/public/data/journalEntries`), where("coupleId", "==", coupleId) );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      entries.sort((a, b) => (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0) - (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0) );
      setJournalEntries(entries); setLoadingJournal(false);
    }, (err) => { console.error("Error fetching journal:", err); setJournalError(`Failed to load: ${err.message}`); setLoadingJournal(false); });
    return () => { 
        Object.values(measureAudioPlayersRef.current).forEach(entryPlayers => {
            if (Array.isArray(entryPlayers)) {
                entryPlayers.forEach(p => p.pause());
            }
        });
        if (sceneAudioPlayerRef.current) sceneAudioPlayerRef.current.pause();
        unsubscribe();
    };
  }, [db, coupleId, appId]);

  const getUserDisplayName = (entryUserId, entryRole = null) => { 
      if (!coupleData) return "A partner";
      if (coupleData.status === "active_testing" && entryUserId === currentUserId) { return entryRole || (entryUserId === coupleData.user1Id ? coupleData.user1DisplayName : coupleData.user2DisplayName) || "Test User"; }
      if (entryUserId === coupleData.user1Id) return coupleData.user1DisplayName || "Partner 1";
      if (entryUserId === coupleData.user2Id) return coupleData.user2DisplayName || "Partner 2";
      return "A partner";
  };

  const playAllMeasures = (entryId, layers) => {
    stopAllMeasuresPlayback(entryId); 
    const players = layers.map(layer => {
        const audio = new Audio(layer.audioData);
        audio.loop = true;
        audio.play().catch(e => console.error("Error playing measure layer:", e));
        return audio;
    });
    measureAudioPlayersRef.current[entryId] = players;
  };
  const stopAllMeasuresPlayback = (entryId) => {
    if (measureAudioPlayersRef.current[entryId]) {
        measureAudioPlayersRef.current[entryId].forEach(player => {
            player.pause();
            player.currentTime = 0;
        });
        delete measureAudioPlayersRef.current[entryId];
    }
  };

  const playFullScene = (entryId, script) => {
    if (isPlayingScene) stopScenePlayback(); 
    
    let lineIndex = 0;
    setIsPlayingScene(true);
    setCurrentPlayingSceneInfo({ entryId, lineIndex });

    function playNextLine() {
        if (lineIndex >= script.length) {
            stopScenePlayback();
            return;
        }
        const line = script[lineIndex];
        if (line.recordedAudioData) {
            const audio = new Audio(line.recordedAudioData);
            sceneAudioPlayerRef.current = audio;
            audio.play().catch(e => console.error("Error playing scene line:", e));
            audio.onended = () => {
                lineIndex++;
                setCurrentPlayingSceneInfo({ entryId, lineIndex });
                playNextLine();
            };
        } else { 
            lineIndex++;
            playNextLine();
        }
    }
    playNextLine();
  };
  const stopScenePlayback = () => {
    if (sceneAudioPlayerRef.current) {
        sceneAudioPlayerRef.current.pause();
        sceneAudioPlayerRef.current.onended = null; 
        sceneAudioPlayerRef.current = null;
    }
    setIsPlayingScene(false);
    setCurrentPlayingSceneInfo({ entryId: null, lineIndex: -1 });
  };


  if (loadingJournal) { return ( <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 text-gray-700 p-4"> <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mb-4"></div> <p className="text-lg animate-pulse">Loading memories...</p> </div> ); }
  if (journalError) { return ( <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-orange-100 text-red-700 p-6"> <div className="bg-white p-8 rounded-xl shadow-2xl text-center"> <h2 className="text-2xl font-bold mb-4">Error Loading Journal</h2> <p className="text-lg mb-2">{journalError}</p> <button onClick={() => window.location.reload()} className="btn-danger">Try Again</button> </div> </div> ); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl text-gray-800">
        <div className="flex items-center justify-between mb-8"> <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Our Journey Journal</h1> <button onClick={() => onNavigate('home')} className="btn-secondary-sm"> <HomeIcon className="w-5 h-5 mr-2" /> Home </button> </div>
        {journalEntries.length === 0 ? (
          <div className="text-center py-10"> <BookIcon className="w-20 h-20 mx-auto text-gray-400 mb-4"/> <p className="text-xl text-gray-500">Journal is empty.</p> <p className="text-gray-500">Complete activities to fill these pages!</p> <button onClick={() => onNavigate('activities')} className="btn-primary mt-6">Explore Activities</button> </div>
        ) : (
          <div className="space-y-6">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-5 rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
                <p className="text-xs text-gray-400 mb-2">{entry.timestamp?.toDate ? new Date(entry.timestamp.toDate()).toLocaleString() : 'Date unavailable'}</p>
                <h3 className="text-2xl font-semibold text-purple-700 mb-3 capitalize flex items-center"> {allActivitiesList.find(a => a.id === entry.activityType)?.icon && React.createElement(allActivitiesList.find(a => a.id === entry.activityType).icon, {className: "w-6 h-6 mr-2 text-purple-600"})} {entry.activityName || entry.activityType.replace(/-/g, ' ')} </h3>
                {entry.result && (
                  <div className="text-gray-700 space-y-2 text-sm">
                    {entry.activityType === 'coin-toss' && entry.result.outcome && ( <p>Outcome: <span className="font-medium text-blue-600">{entry.result.outcome}</span>. Winner: <span className="font-medium text-green-600">{getUserDisplayName(entry.result.winnerId)}</span>!</p> )}
                    {entry.activityType === 'collaborative-story' && entry.result.story && ( <div> <p className="font-medium mb-1 text-purple-600">Our Story (Prompt: <span className="italic text-gray-500">{entry.result.prompt || "N/A"}</span>):</p> <p className="whitespace-pre-wrap italic bg-white p-3 rounded border">{entry.result.story.replace(entry.result.prompt + "\n", "")}</p> </div> )}
                    {entry.activityType === 'song-creation' && entry.result.audioParts && ( <div> <p className="font-medium mb-1 text-purple-600">Our Duet:</p> {entry.result.audioParts.length > 0 ? ( entry.result.audioParts.map((part, index) => ( <div key={index} className="mb-2 p-2 bg-white rounded border"> <p className="text-xs text-gray-500">Track {index + 1} by {getUserDisplayName(part.userId, part.role)}:</p> <audio controls src={part.audioData} className="w-full h-10"></audio> </div> )) ) : ( <p className="italic">No audio recorded.</p> )} </div> )}
                    
                    {entry.activityType === 'duet-harmonies-measures' && entry.result.layers && ( 
                        <div> 
                            <p className="font-medium mb-1 text-purple-600">Layered Harmony (Prompt: <span className="italic text-gray-500">{entry.result.prompt || "N/A"}</span>, Tempo: {entry.result.tempo || "N/A"} BPM):</p> 
                            {entry.result.layers.length > 0 ? (
                                <>
                                    <div className="my-2 space-x-2">
                                        <button onClick={() => playAllMeasures(entry.id, entry.result.layers)} className="btn-icon-sm bg-blue-500 hover:bg-blue-600"><PlayIcon className="w-4 h-4 mr-1"/>Play All</button>
                                        <button onClick={() => stopAllMeasuresPlayback(entry.id)} className="btn-icon-sm bg-gray-500 hover:bg-gray-600"><StopCircleIcon className="w-4 h-4 mr-1"/>Stop All</button>
                                    </div>
                                    {entry.result.layers.map((layer, index) => ( 
                                        <div key={index} className="mb-2 p-2 bg-white rounded border"> 
                                            <p className="text-xs text-gray-500">Layer {index + 1} by {getUserDisplayName(layer.userId)}:</p> 
                                            <audio controls src={layer.audioData} className="w-full h-10"></audio> 
                                        </div> 
                                    ))}
                                </>
                            ) : ( <p className="italic">No layers recorded.</p> )}
                        </div> 
                    )}
                    {entry.activityType === 'scripted-scenes' && entry.result.scenePrompt && ( 
                        <div> 
                            <p className="font-medium mb-1 text-purple-600">Our Scene: <span className="italic text-gray-500">{entry.result.scenePrompt}</span></p> 
                            <div className="my-2 space-x-2">
                                <button onClick={() => playFullScene(entry.id, entry.result.script)} disabled={isPlayingScene && currentPlayingSceneInfo.entryId !== entry.id} className="btn-icon-sm bg-green-500 hover:bg-green-600"><PlayIcon className="w-4 h-4 mr-1"/>Play Scene</button>
                                <button onClick={stopScenePlayback} disabled={!isPlayingScene || currentPlayingSceneInfo.entryId !== entry.id} className="btn-icon-sm bg-gray-500 hover:bg-gray-600"><StopCircleIcon className="w-4 h-4 mr-1"/>Stop Scene</button>
                            </div>
                            <div className="bg-white p-3 rounded border space-y-1"> 
                                {entry.result.script?.map((line, index) => ( 
                                    <div key={index} className={`p-1 rounded ${currentPlayingSceneInfo.entryId === entry.id && currentPlayingSceneInfo.lineIndex === index ? 'bg-yellow-100' : ''}`}> 
                                        <p className="text-xs text-gray-500">{line.char}: <span className="italic">"{line.line}"</span> {line.voiceDirection && `(Direction: ${line.voiceDirection})`}</p> 
                                        {line.recordedAudioData && <audio controls src={line.recordedAudioData} className="w-full h-8 mt-0.5"></audio>} 
                                    </div> 
                                ))} 
                            </div>
                        </div> 
                    )}
                    {typeof entry.result.scoreChange === 'number' && ( <p className="text-sm text-green-600 font-semibold mt-2">Score: +{entry.result.scoreChange} <span role="img" aria-label="points">💖</span></p> )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalPage;
