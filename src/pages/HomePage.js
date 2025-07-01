import React, { useState, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { CoupleContext } from '../contexts/CoupleContext';
import Modal from '../components/Modal';
import { TrophyIcon, ActivityIcon, BookIcon } from '../components/Icons';

const HomePage = ({ onNavigate }) => {
  const { userId, isAuthReady, appId } = useContext(FirebaseContext);
  const { coupleData, loadingCouple, errorCouple, createNewCouple, joinExistingCouple, leaveCouple } = useContext(CoupleContext);
  const [partnerIdInput, setPartnerIdInput] = useState('');
  const [joinCoupleIdInput, setJoinCoupleIdInput] = useState('');
  const [showCreateCoupleModal, setShowCreateCoupleModal] = useState(false);
  const [showJoinCoupleModal, setShowJoinCoupleModal] = useState(false);
  const [showBreakupConfirmModal, setShowBreakupConfirmModal] = useState(false);

  if (!isAuthReady || loadingCouple) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 text-gray-700 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
        <p className="text-xl font-semibold animate-pulse">{!isAuthReady ? "Initializing Twogether..." : "Finding your couple..."}</p>
      </div>
    );
  }

  if (errorCouple) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-orange-100 text-red-700 p-6">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
          <p className="text-lg mb-2">Error: {errorCouple}</p>
          <p className="text-md">Please check your connection or try refreshing.</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Refresh</button>
        </div>
      </div>
    );
  }

  const handleBreakup = () => {
    leaveCouple();
    setShowBreakupConfirmModal(false);
  };

  const partnerDisplayName = () => {
    if (!coupleData) return "your partner";
    if (coupleData.status === "active_testing") return coupleData.user2DisplayName || "Your Test Self (P2)";
    if (coupleData.user1Id === userId) return coupleData.user2DisplayName || "Partner 2";
    if (coupleData.user2Id === userId) return coupleData.user1DisplayName || "Partner 1";
    return "your partner";
  };

  const currentUserDisplayName = () => {
    if (!coupleData) return "You";
    if (coupleData.status === "active_testing") return coupleData.user1DisplayName || "Your Test Self (P1)";
    if (coupleData.user1Id === userId) return coupleData.user1DisplayName || "You (P1)";
    if (coupleData.user2Id === userId) return coupleData.user2DisplayName || "You (P2)";
    return "You";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4 text-gray-800">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center w-full max-w-lg transform transition-all duration-500 ease-out hover:shadow-3xl">
        <TrophyIcon className="w-16 h-16 mx-auto text-yellow-500 mb-2" />
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6">Twogether</h1>
        <p className="text-md mb-1 text-gray-600">Your User ID (share with partner):</p>
        <p className="font-mono bg-gray-100 px-3 py-1.5 rounded-md text-sm break-all shadow-sm mb-6 inline-block">{userId}</p>
        {appId === 'default-app-id-no-firebase' && <p className="text-xs text-orange-500 mb-4">(Note: Firebase not connected. Your ID is temporary.)</p>}

        {coupleData && (coupleData.user1Id && coupleData.user2Id) ? (
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-purple-700 mb-4">
              {coupleData.status === "active_testing" ? "Test Mode Active!" : "Welcome Back, Lovebirds!"}
            </h2>
            <p>You: <span className="font-semibold">{currentUserDisplayName()}</span></p>
            <p>Partner: <span className="font-semibold">{partnerDisplayName()}</span></p>
            {coupleData.status === "active_testing" && <p className="text-sm text-orange-500 mb-2">(You are currently acting as both partners)</p>}
            <p className="text-2xl font-bold text-green-600 my-4">Score: {coupleData.score || 0} <span role="img" aria-label="star">🌟</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button onClick={() => onNavigate('activities')} className="btn-nav">
                <ActivityIcon className="w-10 h-10 mb-2" /> Activities
              </button>
              <button onClick={() => onNavigate('journal')} className="btn-nav">
                <BookIcon className="w-10 h-10 mb-2" /> Journal
              </button>
            </div>
            <button onClick={() => setShowBreakupConfirmModal(true)} className="btn-danger w-full">
              Leave Couple
            </button>
          </div>
        ) : coupleData && (coupleData.user1Id || coupleData.user2Id) ? (
          <div className="mt-8">
            <h2 className="text-2xl font-bold">Waiting for Partner...</h2>
            <p className="my-4">Share User ID (<span className="font-mono">{userId}</span>) or Couple ID (<span className="font-mono">{coupleData.id}</span>).</p>
            <div className="animate-pulse text-purple-600">Connecting...</div>
            <button onClick={() => setShowBreakupConfirmModal(true)} className="btn-secondary w-full mt-6">
              Cancel & Leave
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-3xl font-bold">Let's Get Started!</h2>
            <p className="my-6">(For testing as both, enter '0' as Partner ID).</p>
            <button onClick={() => setShowCreateCoupleModal(true)} className="btn-primary w-full mb-4">
              Create Couple
            </button>
            <button onClick={() => setShowJoinCoupleModal(true)} className="btn-primary w-full">
              Join Couple
            </button>
          </div>
        )}
      </div>
      <Modal isOpen={showCreateCoupleModal} onClose={() => setShowCreateCoupleModal(false)} title="Create Couple">
        <p className="mb-2">Enter partner's User ID.</p>
        <p className="mb-4 text-sm text-gray-500"> (Tip: '0' for test mode).</p>
        <input type="text" value={partnerIdInput} onChange={(e) => setPartnerIdInput(e.target.value)} placeholder="Partner ID or '0'" className="input-field" />
        <button onClick={() => { createNewCouple(partnerIdInput); setShowCreateCoupleModal(false); setPartnerIdInput(''); }} className="btn-primary w-full mt-4">
          Create
        </button>
      </Modal>
      <Modal isOpen={showJoinCoupleModal} onClose={() => setShowJoinCoupleModal(false)} title="Join Couple">
        <p className="mb-4">Enter Couple ID from partner.</p>
        <input type="text" value={joinCoupleIdInput} onChange={(e) => setJoinCoupleIdInput(e.target.value)} placeholder="Couple ID" className="input-field" />
        <button onClick={() => { joinExistingCouple(joinCoupleIdInput); setShowJoinCoupleModal(false); setJoinCoupleIdInput(''); }} className="btn-primary w-full mt-4">
          Join
        </button>
      </Modal>
      <Modal isOpen={showBreakupConfirmModal} onClose={() => setShowBreakupConfirmModal(false)} title="Confirm Leaving" showConfirmButton={true} onConfirm={handleBreakup} confirmText="Yes, Leave" closeButtonText="No, Stay">
        <p>Are you sure?</p>
        <p className="text-sm text-red-500 mt-2">Data removed if only one (or test mode).</p>
      </Modal>
    </div>
  );
};

export default HomePage;
