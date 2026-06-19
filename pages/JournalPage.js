import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { CoupleContext } from '../contexts/CoupleContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const JournalPage = () => {
  const { db, userId } = useContext(FirebaseContext);
  const { coupleData } = useContext(CoupleContext);
  const [entries, setEntries] = useState([]);
  const [newEntryText, setNewEntryText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = ['Milestone', 'Date Night', 'Funny', 'Gratitude', 'General'];

  useEffect(() => {
    if (!db || !coupleData?.id) return;

    const entriesRef = collection(db, 'couples', coupleData.id, 'journalEntries');
    // Using onSnapshot provides real-time updates and integrates with the offline cache enabled earlier
    const q = query(entriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(fetchedEntries);
    });

    return () => unsubscribe();
  }, [db, coupleData?.id]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntryText.trim() || !db || !coupleData?.id) return;

    setIsSubmitting(true);
    try {
      const entriesRef = collection(db, 'couples', coupleData.id, 'journalEntries');
      await addDoc(entriesRef, {
        text: newEntryText,
        authorId: userId,
        tag: selectedTag || 'General',
        createdAt: serverTimestamp()
      });
      setNewEntryText('');
      setSelectedTag('');
    } catch (error) {
      console.error("Error adding journal entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? entry.tag === selectedTag : true;
      return matchesSearch && matchesTag;
    });
  }, [entries, searchQuery, selectedTag]);

  const getAuthorName = (authorId) => {
    if (authorId === coupleData?.user1Id) return coupleData?.user1DisplayName || 'Partner 1';
    if (authorId === coupleData?.user2Id) return coupleData?.user2DisplayName || 'Partner 2';
    return 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-sky-900 font-bold">Shared Journal</h1>
        <p className="text-gray-600">Document your journey, milestones, and little moments.</p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleAddEntry} className="space-y-4">
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            placeholder="Write a new entry..."
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-300 resize-none h-32 text-gray-700"
            required
          />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full sm:w-auto p-2 border border-gray-200 rounded-lg text-gray-600 bg-gray-50 focus:ring-2 focus:ring-sky-300"
            >
              <option value="">Select a Tag (Optional)</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isSubmitting || !newEntryText.trim()}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white px-8 py-2.5 rounded-full font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-1/2 p-2 px-4 border border-gray-200 rounded-full focus:ring-2 focus:ring-sky-300"
        />
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          <button
            onClick={() => setSelectedTag('')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTag === '' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            All
          </button>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTag === tag ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 italic">No entries found. Be the first to write something!</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              {/* Decorative Tag Indicator */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-200 group-hover:bg-sky-400 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className="text-xs font-bold tracking-wider uppercase text-sky-600 bg-sky-50 px-2 py-1 rounded">
                  {entry.tag || 'General'}
                </span>
                <span className="text-sm text-gray-400">
                  {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                </span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap pl-2 leading-relaxed">{entry.text}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end pl-2">
                <p className="text-sm text-gray-500 italic">Written by {getAuthorName(entry.authorId)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JournalPage;