import React, { useState, useEffect, useMemo } from 'react';

export const GratitudeExchangeActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => {
  const activityData = useMemo(() => activity.data || {}, [activity.data]);
  const [myNote, setMyNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-yellow-100');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Wrapped 'notes' in useMemo to prevent re-creation on every render and satisfy ESLint
  const notes = useMemo(() => activityData.notes || {}, [activityData.notes]);
  
  const partnerId = coupleData?.status === "active_testing" 
    ? (userId === coupleData?.user1Id ? coupleData?.user2Id : coupleData?.user1Id) 
    : (userId === coupleData?.user1Id ? coupleData?.user2Id : coupleData?.user1Id);

  useEffect(() => {
    if (notes[userId]) {
      setHasSubmitted(true);
    }
  }, [notes, userId]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const handleSubmit = () => {
    if (!myNote.trim()) return;

    const updatedNotes = { 
      ...notes, 
      [userId]: { text: myNote, color: selectedColor, timestamp: Date.now() } 
    };
    
    setHasSubmitted(true);
    
    // Check if both users have submitted
    const bothSubmitted = coupleData?.status === "active_testing" 
      ? true // Shortcut for testing mode
      : (updatedNotes[coupleData?.user1Id] && updatedNotes[coupleData?.user2Id]);

    onUpdateActivity({
      ...activityData,
      notes: updatedNotes,
      message: bothSubmitted ? "Both notes received!" : "Waiting for your partner to share...",
      bothSubmitted
    });
  };

  const handleComplete = () => {
    onEndActivity({
      outcome: "Exchanged Gratitude",
      scoreChange: 15,
      message: "You both shared your appreciation!"
    });
  };

  const getUserDisplayName = (uid) => {
    if (!coupleData) return "Partner";
    if (uid === coupleData.user1Id) return coupleData.user1DisplayName || "P1";
    if (uid === coupleData.user2Id) return coupleData.user2DisplayName || "P2";
    return "Partner";
  };

  return (
    <div className="flex flex-col items-center p-6 bg-amber-50 rounded-xl shadow-inner border-2 border-amber-100 min-h-[400px]">
      <h3 className="text-3xl font-serif font-bold text-amber-800 mb-2">Gratitude Scrapbook</h3>
      <p className="text-amber-700 mb-6 text-center italic">Take a moment to write down one thing you appreciate about your partner today.</p>

      {!hasSubmitted ? (
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg relative transform rotate-1">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-400 rounded-full shadow-sm opacity-80" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
          <textarea
            className={`w-full h-40 p-4 mt-4 border-none rounded resize-none focus:ring-2 focus:ring-amber-300 font-sans text-gray-800 ${selectedColor}`}
            placeholder="I appreciate it when you..."
            value={myNote}
            onChange={(e) => setMyNote(e.target.value)}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              {['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-green-100'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded-full shadow-sm border-2 ${selectedColor === color ? 'border-gray-600 scale-110' : 'border-transparent'} ${color}`}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
            <button 
              onClick={handleSubmit}
              disabled={!myNote.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-full shadow transition-transform active:scale-95 disabled:opacity-50"
            >
              Pin Note
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-8">
          <p className="text-lg font-medium text-amber-800">{activityData.message}</p>
          
          <div className="flex flex-col md:flex-row justify-center gap-8 w-full max-w-2xl">
            {/* My Note */}
            <div className={`relative p-6 w-full md:w-1/2 shadow-xl transform -rotate-2 rounded-sm ${notes[userId]?.color || 'bg-yellow-100'}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-4 bg-gray-300 shadow-sm opacity-70 rotate-3"></div>
              <p className="font-serif text-xl text-gray-800 mb-4">{notes[userId]?.text}</p>
              <p className="text-right text-sm text-gray-500 font-bold">- {getUserDisplayName(userId)}</p>
            </div>

            {/* Partner's Note */}
            {activityData.bothSubmitted && notes[partnerId] && (
              <div className={`relative p-6 w-full md:w-1/2 shadow-xl transform rotate-2 rounded-sm ${notes[partnerId]?.color || 'bg-pink-100'}`}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-4 bg-gray-300 shadow-sm opacity-70 -rotate-2"></div>
                <p className="font-serif text-xl text-gray-800 mb-4">{notes[partnerId].text}</p>
                <p className="text-right text-sm text-gray-500 font-bold">- {getUserDisplayName(partnerId)}</p>
              </div>
            )}
          </div>

          {activityData.bothSubmitted && (
             <button 
               onClick={handleComplete}
               className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg mt-8 transition-transform active:scale-95"
             >
               Complete Activity
             </button>
          )}
        </div>
      )}
    </div>
  );
};