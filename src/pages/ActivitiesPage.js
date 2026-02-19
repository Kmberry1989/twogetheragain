import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { CoupleContext } from '../contexts/CoupleContext';
import { doc, updateDoc, addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { HomeIcon } from '../components/Icons';
import { getActivityById, buildInitialActivityData } from '../data/activitiesRegistry';
import { EXPERIENCE_FLOW, getExperienceStep } from '../data/experienceFlow';

const ActivitiesPage = ({ onNavigate }) => {
  const { db, userId, appId } = useContext(FirebaseContext);
  const { coupleId, coupleData } = useContext(CoupleContext);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState(null);

  const currentActivityId = coupleData?.currentActivityId || null;
  const experienceStep = getExperienceStep(coupleData?.experienceStep);
  const experienceComplete = Boolean(coupleData?.experienceCompleted) || experienceStep >= EXPERIENCE_FLOW.length;
  const nextExperienceTarget = experienceComplete ? null : EXPERIENCE_FLOW[experienceStep];
  const nextExperienceDetails = nextExperienceTarget ? getActivityById(nextExperienceTarget.id) : null;
  const completedCount = Math.min(EXPERIENCE_FLOW.length, experienceStep);

  useEffect(() => {
    if (!db || !coupleId || !appId || !currentActivityId) {
      setCurrentActivity(null);
      setLoadingActivity(false);
      return;
    }

    setLoadingActivity(true);
    const activityDocRef = doc(db, `artifacts/${appId}/public/data/activities`, currentActivityId);
    const unsubscribeActivity = onSnapshot(
      activityDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCurrentActivity({ id: docSnap.id, ...docSnap.data() });
        } else {
          setCurrentActivity(null);
          updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), { currentActivityId: null })
            .catch((err) => console.error("Error clearing activityId:", err));
        }
        setLoadingActivity(false);
      },
      (err) => {
        console.error("Error listening to activity:", err);
        setActivityError("Failed to load activity.");
        setCurrentActivity(null);
        setLoadingActivity(false);
      }
    );
    return () => unsubscribeActivity();
  }, [db, coupleId, currentActivityId, appId]);

  const startNextExperienceActivity = async () => {
    if (!db || !coupleId || loadingActivity || !coupleData || !appId) {
      setActivityError("Cannot start: missing data or busy.");
      return;
    }
    if (currentActivityId) {
      setActivityError("Activity already in progress.");
      return;
    }
    if (coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id)) {
      setActivityError("Both partners needed.");
      return;
    }
    if (!nextExperienceDetails || !nextExperienceTarget) {
      setActivityError("Experience already complete. Restart to play again.");
      return;
    }

    setLoadingActivity(true);
    setActivityError(null);
    try {
      const initialTurn = coupleData.status === "active_testing"
        ? userId
        : (Math.random() < 0.5 ? coupleData.user1Id : coupleData.user2Id);
      const initialActivityData = {
        ...buildInitialActivityData(nextExperienceDetails.id),
        experiencePhase: nextExperienceTarget.phase
      };
      const newActivityDocRef = await addDoc(
        collection(db, `artifacts/${appId}/public/data/activities`),
        {
          type: nextExperienceDetails.id,
          status: 'in-progress',
          turn: initialTurn,
          createdAt: serverTimestamp(),
          coupleId,
          participants: [coupleData.user1Id, coupleData.user2Id].filter((id) => id != null),
          data: initialActivityData
        }
      );
      await updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), {
        currentActivityId: newActivityDocRef.id
      });
    } catch (err) {
      console.error("Error starting activity:", err);
      setActivityError(`Failed to start: ${err.message}`);
    } finally {
      setLoadingActivity(false);
    }
  };

  const restartExperience = async () => {
    if (!db || !coupleId || !appId) {
      setActivityError("Cannot restart right now.");
      return;
    }
    setLoadingActivity(true);
    setActivityError(null);
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), {
        experienceStep: 0,
        experienceCompleted: false,
        completedActivityIds: [],
        currentActivityId: null
      });
    } catch (err) {
      console.error("Error restarting experience:", err);
      setActivityError(`Failed to restart: ${err.message}`);
    } finally {
      setLoadingActivity(false);
    }
  };

  const endCurrentActivity = async (activityResult = {}) => {
    if (!db || !coupleId || !currentActivity || !appId || !coupleData) {
      setActivityError("Cannot end: missing data.");
      return;
    }

    setLoadingActivity(true);
    setActivityError(null);
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, currentActivity.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        result: activityResult
      });

      const activityDetails = getActivityById(currentActivity.type);
      await addDoc(collection(db, `artifacts/${appId}/public/data/journalEntries`), {
        coupleId,
        activityId: currentActivity.id,
        activityType: currentActivity.type,
        activityName: activityDetails?.name || currentActivity.type,
        result: activityResult,
        timestamp: serverTimestamp(),
        userIds: [coupleData.user1Id, coupleData.user2Id].filter((id) => id != null)
      });

      const scoreChange = activityResult.scoreChange || 0;
      const newScore = (coupleData?.score || 0) + scoreChange;
      const currentStep = getExperienceStep(coupleData?.experienceStep);
      const expectedStepActivityId = EXPERIENCE_FLOW[currentStep]?.id;
      const shouldAdvanceExperience = expectedStepActivityId === currentActivity.type;
      const nextStep = shouldAdvanceExperience ? currentStep + 1 : currentStep;
      const completedActivityIds = Array.isArray(coupleData?.completedActivityIds) ? coupleData.completedActivityIds : [];
      const updatedCompletedActivityIds = completedActivityIds.includes(currentActivity.type)
        ? completedActivityIds
        : [...completedActivityIds, currentActivity.type];

      await updateDoc(doc(db, `artifacts/${appId}/public/data/couples`, coupleId), {
        currentActivityId: null,
        score: newScore,
        experienceStep: nextStep,
        experienceCompleted: nextStep >= EXPERIENCE_FLOW.length,
        completedActivityIds: updatedCompletedActivityIds
      });
      setCurrentActivity(null);
    } catch (err) {
      console.error("Error ending activity:", err);
      setActivityError(`Failed to end: ${err.message}`);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleUpdateActivity = async (updatedData) => {
    if (!db || !currentActivity?.id || !appId) {
      return;
    }

    try {
      const safeUpdatedData = updatedData || {};
      const { turn: nextTurn, ...nextData } = safeUpdatedData;
      await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, currentActivity.id), {
        data: nextData,
        lastUpdated: serverTimestamp(),
        turn: nextTurn || currentActivity.turn
      });
    } catch (err) {
      console.error("Error updating activity:", err);
      setActivityError("Failed to save progress.");
    }
  };

  const currentActivityDetails = currentActivity ? getActivityById(currentActivity.type) : null;
  const CurrentActivityComponent = currentActivityDetails ? currentActivityDetails.component : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl text-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Activities Hub</h1>
          <button onClick={() => onNavigate('home')} className="btn-secondary-sm">
            <HomeIcon className="w-5 h-5 mr-2" /> Home
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-xs uppercase tracking-wide text-teal-700 font-semibold mb-1">Structured Couple Experience</p>
          <p className="text-sm text-gray-700 mb-2">
            Progress: {completedCount} / {EXPERIENCE_FLOW.length}
          </p>
          {nextExperienceTarget ? (
            <div>
              <p className="font-semibold text-teal-700">
                Next: {nextExperienceTarget.phase}
                {nextExperienceDetails ? ` - ${nextExperienceDetails.name}` : ''}
              </p>
              <p className="text-sm text-gray-600">{nextExperienceTarget.summary}</p>
            </div>
          ) : (
            <p className="font-semibold text-green-700">Experience complete. You can restart and replay together.</p>
          )}
        </div>

        {loadingActivity && !currentActivity && (
          <p className="text-center text-blue-500 text-lg my-8 animate-pulse">Loading activity...</p>
        )}

        {currentActivity && CurrentActivityComponent ? (
          <div className="mt-6 p-4 sm:p-6 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50/50">
            <div className="flex items-center mb-4">
              {currentActivityDetails?.icon && <currentActivityDetails.icon className="w-8 h-8 text-teal-600 mr-3" />}
              <h2 className="text-3xl font-semibold text-teal-700">{currentActivityDetails?.name || "Current Activity"}</h2>
            </div>
            <CurrentActivityComponent
              activity={currentActivity}
              onUpdateActivity={handleUpdateActivity}
              onEndActivity={endCurrentActivity}
              coupleData={coupleData}
              userId={userId}
            />
            {activityError && <p className="text-center text-red-500 mt-4 p-2 bg-red-100 rounded">{activityError}</p>}
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-xl mb-6 text-gray-600">
              {experienceComplete ? "You completed the full sequence." : "Ready for your next experience step?"}
            </p>
            {!experienceComplete ? (
              <button
                onClick={startNextExperienceActivity}
                disabled={loadingActivity || !coupleId || !coupleData || (coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id))}
                className="btn-primary-lg"
              >
                {loadingActivity ? <span className="animate-pulse">Starting...</span> : `Start ${nextExperienceDetails?.name || 'Next Activity'}`}
              </button>
            ) : (
              <button
                onClick={restartExperience}
                disabled={loadingActivity || !coupleId}
                className="btn-primary-lg"
              >
                {loadingActivity ? <span className="animate-pulse">Restarting...</span> : 'Restart Experience'}
              </button>
            )}
            {!coupleId && <p className="text-red-500 mt-3 text-sm">Please join/create a couple first.</p>}
            {coupleData && coupleData.status !== "active_testing" && (!coupleData.user1Id || !coupleData.user2Id) && (
              <p className="text-orange-600 mt-3 text-sm">Waiting for partner.</p>
            )}
            {activityError && <p className="text-red-500 mt-3 p-2 bg-red-100 rounded text-sm">{activityError}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
