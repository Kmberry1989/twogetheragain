import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from '../components/Icons';

export const SongCreationActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
  const isMyTurn = activity.turn === userId || (coupleData?.status === "active_testing");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [message, setMessage] = useState(activity.data?.message || '');
  const audioParts = activity.data?.audioParts || [];
  const maxAudioPartsPerUser = activity.data?.maxPartsPerUser || 2;
  const totalMaxParts = maxAudioPartsPerUser * (coupleData?.status === "active_testing" ? 1 : 2);
  const audioPlaybackRef = useRef(null);

  useEffect(() => {
    setMessage(activity.data?.message || '');
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [activity.data, mediaRecorder]);

  const getUserDisplayName = (uid, cplData, role = "") => {
    if (!cplData) return "Partner";
    if (cplData.status === "active_testing" && uid === cplData.user1Id) {
      return role || (cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName);
    }
    if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1";
    if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2";
    return "Partner";
  };

  const startRecording = async () => {
    if (!isMyTurn) { setMessage("Not your turn."); return; }
    const currentUserPartsCount = audioParts.filter(p => p.userId === userId).length;
    const effectiveMaxPartsForCurrentUserInTestMode = maxAudioPartsPerUser * 2;
    if (coupleData?.status === "active_testing") {
      if (currentUserPartsCount >= effectiveMaxPartsForCurrentUserInTestMode) { setMessage("All test parts recorded!"); return; }
    } else {
      if (currentUserPartsCount >= maxAudioPartsPerUser) { setMessage("Your tracks done! Waiting for partner."); return; }
    }
    if (audioParts.length >= totalMaxParts && coupleData?.status !== "active_testing") { setMessage("Masterpiece complete!"); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result;
          const partRole = coupleData?.status === "active_testing" ? (audioParts.length % 2 === 0 ? "(P1 Test Part)" : "(P2 Test Part)") : "";
          const newAudioParts = [...audioParts, { userId: userId, audioData: base64data, timestamp: new Date().toISOString(), role: partRole }];
          let nextTurnUser;
          let activityMessage = `${getUserDisplayName(userId, coupleData, partRole)} recorded!`;

          if (coupleData?.status === "active_testing") {
            nextTurnUser = userId;
            if (newAudioParts.length < effectiveMaxPartsForCurrentUserInTestMode) {
              activityMessage += ` Ready for next part!`;
            } else {
              activityMessage += ` All test parts recorded!`;
            }
          } else {
            nextTurnUser = userId === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id;
            const user1PartsCount = newAudioParts.filter(p => p.userId === coupleData.user1Id).length;
            const user2PartsCount = newAudioParts.filter(p => p.userId === coupleData.user2Id).length;
            if (user1PartsCount >= maxAudioPartsPerUser && user2PartsCount < maxAudioPartsPerUser) {
              nextTurnUser = coupleData.user2Id;
              activityMessage += ` Now ${getUserDisplayName(coupleData.user2Id, coupleData)}'s turn!`;
            } else if (user2PartsCount >= maxAudioPartsPerUser && user1PartsCount < maxAudioPartsPerUser) {
              nextTurnUser = coupleData.user1Id;
              activityMessage += ` Now ${getUserDisplayName(coupleData.user1Id, coupleData)}'s turn!`;
            } else if (newAudioParts.length < totalMaxParts) {
              activityMessage += ` Now ${getUserDisplayName(nextTurnUser, coupleData)}'s turn!`;
            }
          }
          const finalPartsTarget = coupleData?.status === "active_testing" ? effectiveMaxPartsForCurrentUserInTestMode : totalMaxParts;
          if (newAudioParts.length >= finalPartsTarget) {
            onEndActivity({ audioParts: newAudioParts, scoreChange: 30 + newAudioParts.length * 5, message: "Song complete!" });
          } else {
            await onUpdateActivity({ ...activity.data, audioParts: newAudioParts, turn: nextTurnUser, message: activityMessage });
            setMessage("Track recorded! Waiting...");
          }
        };
      };
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);
      setMessage("Recording... 🎤");
    } catch (err) {
      console.error("Mic error:", err);
      setMessage("Mic error: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const currentUserPartsCount = audioParts.filter(p => p.userId === userId).length;
  const effectiveMaxPartsForCurrentUserInTestMode = maxAudioPartsPerUser * 2;
  let canRecordMore;
  if (coupleData?.status === "active_testing") {
    canRecordMore = currentUserPartsCount < effectiveMaxPartsForCurrentUserInTestMode;
  } else {
    canRecordMore = currentUserPartsCount < maxAudioPartsPerUser;
  }
  const currentTotalParts = audioParts.length;
  const finalPartsTarget = coupleData?.status === "active_testing" ? effectiveMaxPartsForCurrentUserInTestMode : totalMaxParts;

  return (
    <div className="text-center p-4 rounded-lg bg-pink-50 shadow-inner">
      <h3 className="text-2xl font-bold mb-3 text-pink-700">Duet Harmonies</h3>
      <p>Tracks: {currentTotalParts} / {finalPartsTarget}</p>
      {coupleData?.status !== "active_testing" && <p>Your Tracks: {currentUserPartsCount} / {maxAudioPartsPerUser}</p>}
      <p className="text-lg mb-4 font-medium">
        {currentTotalParts >= finalPartsTarget ? "Song complete!" : isMyTurn && canRecordMore ? "Your turn!" : isMyTurn && !canRecordMore ? (coupleData?.status === "active_testing" ? "All test parts done!" : "Your parts done! Waiting...") : `Waiting for ${getUserDisplayName(activity.turn, coupleData)}...`}
      </p>
      <div className="mb-6 space-y-3 max-h-60 overflow-y-auto p-2 bg-white rounded border">
        {audioParts.length === 0 && <p className="italic">No tracks.</p>}
        {audioParts.map((part, index) => (
          <div key={index} className="p-2 bg-pink-100 rounded shadow-sm flex items-center justify-between">
            <span className="text-sm text-pink-800">Track {index + 1} by {getUserDisplayName(part.userId, coupleData, part.role)}</span>
            <audio controls src={part.audioData} ref={audioPlaybackRef} className="w-3/5 h-8"></audio>
          </div>
        ))}
      </div>
      {isMyTurn && canRecordMore && currentTotalParts < finalPartsTarget && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <button onClick={startRecording} disabled={isRecording} className="btn-record">
            <MicIcon className="w-5 h-5 mr-2 inline" /> {isRecording ? 'Recording...' : 'Start'}
          </button>
          <button onClick={stopRecording} disabled={!isRecording} className="btn-secondary">
            Stop
          </button>
        </div>
      )}
      {currentTotalParts >= finalPartsTarget && !isRecording && (
        <button onClick={() => onEndActivity({ audioParts: audioParts, scoreChange: 30 + audioParts.length * 5, message: "Song complete!" })} className="btn-success mt-4">
          Finish!
        </button>
      )}
      {message && <p className="text-sm text-gray-500 mt-3 italic">{message}</p>}
    </div>
  );
};
