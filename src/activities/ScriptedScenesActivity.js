import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from '../components/Icons';

export const ScriptedScenesActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
    const activityData = activity.data || {};
    const script = activityData.script || [];
    const currentLineIndex = activityData.currentLineIndex || 0;
    const currentLine = script[currentLineIndex];
    const isMyTurn = currentLine && (activity.turn === userId || (coupleData?.status === "active_testing"));
    
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [message, setMessage] = useState(activityData.message || `Scene: ${activityData.scenePrompt || "A Mystery Scene!"}`);

    useEffect(() => {
        setMessage(activityData.message || `Scene: ${activityData.scenePrompt || "A Mystery Scene!"}`);
    }, [activityData.message, activityData.scenePrompt]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const voiceDirections = ["with a deep voice", "whispering", "excitedly", "very tired", "like a robot", "singing it", "very fast", "super slowly", "like you're on stage"];

    const getUserDisplayName = (uid, cplData) => { 
      if (!cplData) return "Partner"; 
      if (cplData.status === "active_testing" && uid === cplData.user1Id) { return cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName; } 
      if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1"; 
      if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2"; 
      return "Partner"; 
    };

    const startRecording = async () => {
        if (!isMyTurn || !currentLine || isRecording) {
             setMessage(!isMyTurn ? "Not your turn." : !currentLine ? "Script finished!" : "Already recording.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks = [];
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current = null;
                setIsRecording(false);
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    const updatedScript = script.map((line, index) => 
                        index === currentLineIndex ? { ...line, recordedAudioData: base64data, userId: userId } : line
                    );
                    
                    const nextLineIndex = currentLineIndex + 1;
                    let nextTurnUser;
                    let activityMessage = `${getUserDisplayName(userId, coupleData)} delivered their line!`;

                    if (nextLineIndex >= script.length) {
                        onEndActivity({
                            scenePrompt: activityData.scenePrompt,
                            script: updatedScript,
                            scoreChange: 15 + script.length * 2,
                            message: "Scene complete! Bravo!",
                        });
                        return;
                    } else {
                        const nextLineChar = updatedScript[nextLineIndex].char;
                        if (coupleData?.status === "active_testing") {
                            nextTurnUser = userId;
                        } else {
                            nextTurnUser = (activity.turn === coupleData.user1Id) ? coupleData.user2Id : coupleData.user1Id;
                        }
                        
                        updatedScript[nextLineIndex].voiceDirection = voiceDirections[Math.floor(Math.random() * voiceDirections.length)];
                        activityMessage += ` Next up: ${getUserDisplayName(nextTurnUser, coupleData)} as ${nextLineChar}.`;

                        await onUpdateActivity({
                            ...activityData,
                            script: updatedScript,
                            currentLineIndex: nextLineIndex,
                            turn: nextTurnUser,
                            message: activityMessage,
                        });
                    }
                };
            };
            recorder.start();
            setIsRecording(true);
            setMessage(`Recording line for ${currentLine.char}...`);
        } catch (err) { console.error("Mic error:", err); setMessage("Mic error: " + err.message); setIsRecording(false); }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="text-center p-4 rounded-lg bg-orange-50 shadow-inner">
            <h3 className="text-2xl font-bold mb-1 text-orange-700">Scripted Scenes</h3>
            <p className="text-sm text-gray-600 mb-3 italic">Scene: {activityData.scenePrompt || "A Grand Performance!"}</p>

            {currentLineIndex > 0 && script[currentLineIndex-1]?.recordedAudioData && (
                <div className="my-3 p-2 bg-white rounded border border-orange-200">
                    <p className="text-xs text-gray-500">Previous line by {getUserDisplayName(script[currentLineIndex-1].userId, coupleData)} as {script[currentLineIndex-1].char}:</p>
                    <audio controls src={script[currentLineIndex-1].recordedAudioData} className="w-full h-8"></audio>
                </div>
            )}

            {currentLine && (
                <div className="my-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                    <p className="text-md font-semibold">
                        {(coupleData?.status === "active_testing" || activity.turn === userId) ? "Your Turn" : `Waiting for ${getUserDisplayName(activity.turn, coupleData)}`} as <span className="text-orange-800">{currentLine.char}</span>
                    </p>
                    <p className="text-lg my-1">Line: "<span className="italic font-medium">{currentLine.line}</span>"</p>
                    {currentLine.voiceDirection && <p className="text-sm text-gray-700">Direction: <span className="italic">{currentLine.voiceDirection}</span></p>}
                </div>
            )}

            {isMyTurn && currentLine && currentLineIndex < script.length && (
                 <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                    <button onClick={startRecording} disabled={isRecording} className="btn-record">
                        <MicIcon className="w-5 h-5 mr-2 inline"/> {isRecording ? 'Recording...' : `Record as ${currentLine.char}`}
                    </button>
                    <button onClick={stopRecording} disabled={!isRecording} className="btn-secondary">Stop</button>
                </div>
            )}

            {currentLineIndex >= script.length && !isRecording && (
                 <button onClick={() => onEndActivity({ scenePrompt: activityData.scenePrompt, script: script, scoreChange: 15 + script.length * 2, message: "Scene complete! Bravo!"})}
                    className="btn-success mt-6">
                    Finish Scene & Save Performance
                </button>
            )}
            {message && <p className="text-sm text-gray-600 mt-3 italic">{message}</p>}
        </div>
    );
};
