import React, { useState, useEffect, useRef, useMemo } from 'react';

export const DuetHarmoniesMeasuresActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
    const activityData = activity.data || {};
    const isMyTurn = activity.turn === userId || (coupleData?.status === "active_testing");
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [message, setMessage] = useState(activityData.message || `Get ready to layer some sounds for: ${activityData.prompt}!`);
    const [audioPlayers, setAudioPlayers] = useState([]);

    const layers = useMemo(() => activityData.layers || [], [activityData.layers]);
    const maxLayersPerUser = activityData.maxLayersPerUser || 2;
    const totalLayersGoal = maxLayersPerUser * (coupleData?.status === "active_testing" ? 2 : 2);

    const currentUserLayersCount = layers.filter(layer => layer.userId === userId).length;
    const canRecordMore = coupleData?.status === "active_testing" ? 
                          layers.length < totalLayersGoal : 
                          currentUserLayersCount < maxLayersPerUser;

    const secondsPerLoop = activityData.secondsPerLoop || 4;

    useEffect(() => {
        setMessage(activityData.message || `Current prompt: ${activityData.prompt || "Freestyle!"}`);
        const players = layers.map(layer => {
            const audio = new Audio(layer.audioData);
            audio.loop = true;
            return audio;
        });
        setAudioPlayers(players);
        return () => {
            players.forEach(player => { player.pause(); player.src = ''; });
        };
    }, [layers, activityData.prompt, activityData.message]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);


    const playAllLayers = () => {
        audioPlayers.forEach(player => {
            player.currentTime = 0;
            player.play().catch(e => console.error("Error playing layer:", e));
        });
        setMessage("Playing all layers! Feel the groove!");
    };

    const stopAllLayers = () => {
        audioPlayers.forEach(player => player.pause());
        setMessage("Playback stopped.");
    };

    const getUserDisplayName = (uid, cplData) => { 
      if (!cplData) return "Partner"; 
      if (cplData.status === "active_testing" && uid === cplData.user1Id) { return cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName; } 
      if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1"; 
      if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2"; 
      return "Partner"; 
    };

    const startRecording = async () => {
        if (!isMyTurn || !canRecordMore || isRecording) {
            setMessage(!isMyTurn ? "Not your turn." : !canRecordMore ? "You've added all your layers!" : "Already recording.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks = [];
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstart = () => {
                setTimeout(() => {
                    if (recorder.state === "recording") {
                        recorder.stop();
                    }
                }, secondsPerLoop * 1000);
            };
            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current = null;
                setIsRecording(false);
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    const newLayer = { userId, audioData: base64data, layerNum: layers.length + 1 };
                    const updatedLayers = [...layers, newLayer];
                    
                    let nextTurnUser = coupleData?.status === "active_testing" ? userId : (userId === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id);
                    let activityMessage = `${getUserDisplayName(userId, coupleData)} added a layer!`;

                    if (updatedLayers.length >= totalLayersGoal) {
                        onEndActivity({
                            prompt: activityData.prompt,
                            tempo: activityData.tempo,
                            layers: updatedLayers,
                            scoreChange: 25 + updatedLayers.length * 3,
                            message: "Harmony complete! What a vibe!",
                        });
                    } else {
                        await onUpdateActivity({
                            ...activityData,
                            layers: updatedLayers,
                            turn: nextTurnUser,
                            message: activityMessage + ` ${getUserDisplayName(nextTurnUser, coupleData)}'s turn.`,
                        });
                    }
                };
            };
            recorder.start();
            setIsRecording(true);
            setMessage(`Recording your ${secondsPerLoop}-second loop...`);
        } catch (err) {
            console.error("Mic error:", err);
            setMessage("Mic error: " + err.message);
            setIsRecording(false);
        }
    };

    const stopRecordingEarly = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="text-center p-4 rounded-lg bg-indigo-50 shadow-inner">
            <h3 className="text-2xl font-bold mb-1 text-indigo-700">Duet Harmonies (Measures)</h3>
            <p className="text-sm text-gray-600 mb-1">Prompt: <span className="italic">{activityData.prompt || "Freestyle!"}</span></p>
            <p className="text-sm text-gray-600 mb-3">Tempo: {activityData.tempo || 120} BPM | Loop: {secondsPerLoop}s</p>
            
            <p className="text-lg mb-2 font-medium">
                Layers: {layers.length} / {totalLayersGoal}
                {coupleData?.status !== "active_testing" && ` (Your Layers: ${currentUserLayersCount}/${maxLayersPerUser})`}
            </p>
            <p className="text-md mb-4">
                {layers.length >= totalLayersGoal ? "All layers recorded!" :
                 isMyTurn && canRecordMore ? "Your turn to add a layer!" :
                 isMyTurn && !canRecordMore ? "You've added all your layers! Waiting for partner." :
                 `Waiting for ${getUserDisplayName(activity.turn, coupleData)}...`}
            </p>

            <div className="my-4 space-x-2">
                <button onClick={playAllLayers} disabled={layers.length === 0 || isRecording} className="btn-primary-sm">Play All</button>
                <button onClick={stopAllLayers} disabled={layers.length === 0 || isRecording} className="btn-secondary-sm">Stop All</button>
            </div>

            {isMyTurn && canRecordMore && layers.length < totalLayersGoal && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                    <button
                        onClick={startRecording}
                        disabled={isRecording}
                        className="btn-record"
                    >
                        {isRecording ? `Recording (${secondsPerLoop}s)...` : `Record Layer ${layers.length + 1}`}
                    </button>
                    <button
                        onClick={stopRecordingEarly}
                        disabled={!isRecording}
                        className="btn-secondary"
                    >
                        Stop
                    </button>
                </div>
            )}
            
            <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                {layers.map((layer, index) => (
                    <div key={index} className="p-2 bg-white rounded border flex justify-between items-center">
                        <span className="text-sm">L{index + 1} by {getUserDisplayName(layer.userId, coupleData)}</span>
                        <audio controls src={layer.audioData} className="h-8 w-3/5"></audio>
                    </div>
                ))}
            </div>

            {layers.length >= totalLayersGoal && !isRecording && (
                <button onClick={() => onEndActivity({ prompt: activityData.prompt, tempo: activityData.tempo, layers: layers, scoreChange: 25 + layers.length * 3, message: "Harmony complete!"})}
                    className="btn-success mt-6">
                    Finish & Save Harmony
                </button>
            )}
            {message && <p className="text-sm text-gray-600 mt-3 italic">{message}</p>}
        </div>
    );
};
