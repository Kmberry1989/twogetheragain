import React, { useState, useEffect } from 'react';

export const GratitudeExchangeActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
  const activityData = activity.data || {};
  const isTesting = coupleData?.status === "active_testing";
  const isMyTurn = activity.turn === userId || isTesting;
  const prompt = activityData.prompt || "Share one thing you appreciate about your partner right now.";
  const notes = Array.isArray(activityData.notes) ? activityData.notes : [];
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
      setMessage("Write a gratitude note first.");
      return;
    }
    if (!isTesting && notes.some((item) => item.userId === userId)) {
      setMessage("You already submitted your gratitude note.");
      return;
    }

    const role = isTesting ? (notes.length === 0 ? "(P1 Gratitude)" : "(P2 Gratitude)") : "";
    const updatedNotes = [...notes, { userId, role, text: note.trim() }];

    if (updatedNotes.length >= 2) {
      onEndActivity({
        prompt,
        notes: updatedNotes,
        scoreChange: 22,
        message: "Gratitude exchange complete. Connection boosted."
      });
      return;
    }

    const nextTurnUser = isTesting ? userId : (userId === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id);
    await onUpdateActivity({
      ...activityData,
      notes: updatedNotes,
      turn: nextTurnUser,
      message: `${getUserDisplayName(userId, coupleData, role)} shared gratitude. ${getUserDisplayName(nextTurnUser, coupleData)} is next.`
    });
    setNote('');
  };

  return (
    <div className="text-center p-4 rounded-lg bg-rose-50 shadow-inner">
      <h3 className="text-2xl font-bold mb-2 text-rose-700">Gratitude Exchange</h3>
      <p className="text-sm text-gray-600 mb-4">{prompt}</p>
      <p className="text-md mb-3">
        {notes.length >= 2
          ? "Exchange complete!"
          : isMyTurn
            ? "Your turn to write one gratitude note."
            : `Waiting for ${getUserDisplayName(activity.turn, coupleData)}...`}
      </p>

      {notes.length < 2 && isMyTurn && (
        <div className="mb-4">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="I appreciate you because..."
            rows="3"
            className="input-field"
          />
          <button onClick={handleSubmit} className="btn-primary mt-2">
            Share Gratitude
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2 text-left">
        {notes.map((item, index) => (
          <div key={`${item.userId}-${index}`} className="bg-white rounded border p-2">
            <p className="text-sm font-medium text-rose-700">
              {getUserDisplayName(item.userId, coupleData, item.role)}
            </p>
            <p className="text-sm text-gray-700">"{item.text}"</p>
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-gray-600 mt-3 italic">{message}</p>}
    </div>
  );
};
