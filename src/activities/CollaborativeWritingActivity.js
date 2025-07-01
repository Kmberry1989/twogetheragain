import React, { useState, useEffect } from 'react';

export const CollaborativeWritingActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
  const isMyTurn = activity.turn === userId || (coupleData?.status === "active_testing");
  const [mySentence, setMySentence] = useState('');
  const [message, setMessage] = useState(activity.data?.message || '');
  const maxTurns = activity.data?.maxTurns || 5; 
  const currentStory = activity.data?.currentText || activity.data?.prompt || "The story begins...\n";
  const turnCount = activity.data?.turnCount || 0;
  const storyPrompt = activity.data?.prompt || "Once upon a time...";

  useEffect(() => {
    setMessage(activity.data?.message || '');
  }, [activity.data]);

  const getUserDisplayName = (uid, cplData) => {
    if (!cplData) return "Partner";
    if (cplData.status === "active_testing" && uid === cplData.user1Id) {
      return cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName;
    }
    if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1";
    if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2";
    return "Partner";
  };

  const handleAddSentence = async () => {
    if (!isMyTurn) {
      setMessage("Patience, wordsmith! It's not your turn yet.");
      return;
    }
    if (!mySentence.trim()) {
      setMessage("Please weave your magic with a sentence first!");
      return;
    }

    const newStory = currentStory + mySentence.trim() + "\n";
    const nextTurnCount = turnCount + 1;
    let nextTurnUser;
    if (coupleData?.status === "active_testing") {
      nextTurnUser = userId;
    } else {
      nextTurnUser = userId === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id;
    }
    const activityMessage = `${getUserDisplayName(userId, coupleData)} added to the tale. Now it's ${getUserDisplayName(nextTurnUser, coupleData)}'s turn!`;

    setMySentence('');

    if (nextTurnCount >= maxTurns * 2) {
      onEndActivity({
        story: newStory,
        prompt: storyPrompt,
        scoreChange: 20 + Math.floor(newStory.length / 50),
        message: "Our epic saga is complete! What a masterpiece!",
      });
    } else {
      await onUpdateActivity({
        ...activity.data,
        currentText: newStory,
        turn: nextTurnUser,
        turnCount: nextTurnCount,
        message: activityMessage,
      });
      setMessage("Your words are woven! Waiting for your partner's inspiration...");
    }
  };

  return (
    <div className="text-center p-4 rounded-lg bg-purple-50 shadow-inner">
      <h3 className="text-2xl font-bold mb-3 text-purple-700">Our Story Unfolds</h3>
      <p>Turns: {turnCount} / {maxTurns * 2}</p>
      <p className="text-lg mb-4 font-medium">
        {turnCount >= maxTurns * 2 ? "Our story is complete!" : isMyTurn ? "Your turn to add a sentence!" : `Waiting for ${getUserDisplayName(activity.turn, coupleData)} to continue the saga...`}
      </p>
      <div className="mb-4 p-4 bg-white rounded-lg border-2 border-purple-200 min-h-[150px] text-left whitespace-pre-wrap shadow">
        <p className="text-xs text-gray-500 italic mb-2">Prompt: {storyPrompt}</p>
        <p className="text-gray-800 leading-relaxed">{currentStory.replace(storyPrompt + "\n", "")}</p>
      </div>
      {isMyTurn && turnCount < maxTurns * 2 && (
        <div className="mt-4">
          <textarea
            value={mySentence}
            onChange={(e) => setMySentence(e.target.value)}
            placeholder="Add your sentence here..."
            rows="3"
            className="input-field"
          />
          <button onClick={handleAddSentence} className="btn-primary mt-2">
            Add to Story
          </button>
        </div>
      )}
      {message && <p className="text-sm text-gray-500 mt-3 italic">{message}</p>}
      {turnCount >= maxTurns * 2 && (
        <button onClick={() => onEndActivity({ story: currentStory, prompt: storyPrompt, scoreChange: 20 + Math.floor(currentStory.length / 50), message: "Story complete!" })} className="btn-success mt-6">
          Finish
        </button>
      )}
    </div>
  );
};
