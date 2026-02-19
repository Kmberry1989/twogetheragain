import React, { useState, useEffect } from 'react';

export const CheckInActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
  const activityData = activity.data || {};
  const isTesting = coupleData?.status === "active_testing";
  const isMyTurn = activity.turn === userId || isTesting;
  const prompt = activityData.prompt || "How are we feeling right now?";
  const entries = Array.isArray(activityData.entries) ? activityData.entries : [];
  const [mood, setMood] = useState(activityData.selectedMood || 3);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState(activityData.message || '');

  useEffect(() => {
    setMessage(activityData.message || '');
  }, [activityData.message]);

  const getUserDisplayName = (uid, cplData, role = "") => {
    if (!cplData) return "Partner";
    if (cplData.status === "active_testing" && uid === cplData.user1Id) {
      return role || (cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName);
    }
    if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1";
    if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2";
    return "Partner";
  };

  const handleSubmit = async () => {
    if (!isMyTurn) {
      setMessage("Wait for your partner's turn.");
      return;
    }
    if (!note.trim()) {
      setMessage("Share a quick note with your mood.");
      return;
    }

    if (!isTesting && entries.some((entry) => entry.userId === userId)) {
      setMessage("You already submitted your check-in.");
      return;
    }

    const role = isTesting ? (entries.length === 0 ? "(P1 Check-in)" : "(P2 Check-in)") : "";
    const updatedEntries = [
      ...entries,
      { userId, role, mood, note: note.trim() }
    ];

    if (updatedEntries.length >= 2) {
      onEndActivity({
        prompt,
        entries: updatedEntries,
        scoreChange: 18,
        message: "Check-in complete! Great emotional sync."
      });
      return;
    }

    const nextTurnUser = isTesting ? userId : (userId === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id);
    await onUpdateActivity({
      ...activityData,
      entries: updatedEntries,
      turn: nextTurnUser,
      message: `${getUserDisplayName(userId, coupleData, role)} checked in. ${getUserDisplayName(nextTurnUser, coupleData)} is up next.`
    });
    setNote('');
  };

  return (
    <div className="text-center p-4 rounded-lg bg-emerald-50 shadow-inner">
      <h3 className="text-2xl font-bold mb-2 text-emerald-700">Relationship Check-In</h3>
      <p className="text-sm text-gray-600 mb-3">{prompt}</p>
      <p className="text-md mb-3">
        {entries.length >= 2
          ? "Check-in complete!"
          : isMyTurn
            ? "Your turn to check in."
            : `Waiting for ${getUserDisplayName(activity.turn, coupleData)}...`}
      </p>

      <div className="mb-4 bg-white p-3 rounded border">
        <p className="text-sm font-medium mb-2">Mood: {mood}/5</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMood(value)}
              className={`px-3 py-1 rounded ${mood === value ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
              disabled={!isMyTurn || entries.length >= 2}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {entries.length < 2 && isMyTurn && (
        <div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="One short feeling update..."
            rows="3"
            className="input-field"
          />
          <button onClick={handleSubmit} className="btn-primary mt-2">
            Submit Check-In
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2 text-left">
        {entries.map((entry, index) => (
          <div key={`${entry.userId}-${index}`} className="bg-white rounded border p-2">
            <p className="text-sm font-medium text-emerald-700">
              {getUserDisplayName(entry.userId, coupleData, entry.role)}: Mood {entry.mood}/5
            </p>
            <p className="text-sm text-gray-700">"{entry.note}"</p>
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-gray-600 mt-3 italic">{message}</p>}
    </div>
  );
};
