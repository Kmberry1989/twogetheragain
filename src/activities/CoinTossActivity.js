import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export const CoinTossActivity = ({ activity, onUpdateActivity, onEndActivity, coupleData, userId }) => { 
  const isMyTurn = activity.turn === userId || (coupleData?.status === "active_testing" && (activity.turn === coupleData?.user1Id || activity.turn === coupleData?.user2Id));
  const canvasRef = useRef(null); 
  const [message, setMessage] = useState(activity.data?.message || ''); 
  const [tossInitiatedByMe, setTossInitiatedByMe] = useState(false); 
  const tossResult = activity.data?.tossResult || null; 
  const showContinueButton = activity.data?.showContinueButton || false; 
  const playerAssignments = activity.data?.playerAssignments || {};
  const scene = useRef(null); 
  const camera = useRef(null); 
  const renderer = useRef(null); 
  const coin = useRef(null); 
  const animationFrameId = useRef(null); 
  const rotationSpeed = useRef(0.0); 
  const targetRotationY = useRef(0); 
  const isAnimating = useRef(false);

  useEffect(() => { 
    if (!activity.data?.playerAssignments && coupleData?.user1Id && coupleData?.user2Id) { 
      const assignments = {}; 
      const coinSides = ['Heads', 'Tails']; 
      const shuffledSides = coinSides.sort(() => 0.5 - Math.random()); 
      assignments[coupleData.user1Id] = shuffledSides[0]; 
      if (coupleData.user1Id === coupleData.user2Id && coupleData.status === "active_testing") {} 
      else { assignments[coupleData.user2Id] = shuffledSides[1]; } 
      onUpdateActivity({ ...activity.data, playerAssignments: assignments, message: "Assignments made!" }); 
    } 
  }, [activity.data, coupleData, onUpdateActivity, userId]);

  useEffect(() => { 
    setMessage(activity.data?.message || ''); 
    if(activity.data?.tossResult && coin.current && !isAnimating.current){ 
      coin.current.rotation.y = activity.data.tossResult === 'Heads' ? 0 : Math.PI; 
      coin.current.rotation.x = Math.PI / 2; 
    } 
  }, [activity.data]);

  useEffect(() => { 
    const currentCanvas = canvasRef.current; 
    if (!currentCanvas) return; 
    scene.current = new THREE.Scene(); 
    scene.current.background = new THREE.Color(0xE0F2FE); 
    camera.current = new THREE.PerspectiveCamera(75, currentCanvas.clientWidth / currentCanvas.clientHeight, 0.1, 1000); 
    camera.current.position.set(0, 0.5, 1.5); 
    camera.current.lookAt(0,0,0); 
    renderer.current = new THREE.WebGLRenderer({ canvas: currentCanvas, antialias: true, alpha: true }); 
    renderer.current.setSize(currentCanvas.clientWidth, currentCanvas.clientHeight); 
    renderer.current.setPixelRatio(window.devicePixelRatio); 
    renderer.current.shadowMap.enabled = true; 
    const coinRadius = 0.5, coinHeight = 0.05; 
    const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinHeight, 64); 
    const createTextTexture = (text, color, bgColor) => { const tc = document.createElement('canvas'); const ctx = tc.getContext('2d'); tc.width = 256; tc.height = 256; ctx.fillStyle = bgColor; ctx.fillRect(0,0,tc.width, tc.height); ctx.font = 'bold 96px Arial'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, tc.width / 2, tc.height / 2); return new THREE.CanvasTexture(tc); }; 
    const headsMaterial = new THREE.MeshStandardMaterial({ map: createTextTexture('H', '#DAA520', '#FFEB3B'), metalness: 0.7, roughness: 0.3 }); 
    const tailsMaterial = new THREE.MeshStandardMaterial({ map: createTextTexture('T', '#A9A9A9', '#E0E0E0'), metalness: 0.7, roughness: 0.3 }); 
    const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xB87333, metalness: 0.5, roughness: 0.5 }); 
    coin.current = new THREE.Mesh(coinGeometry, [sideMaterial, headsMaterial, tailsMaterial]); 
    coin.current.rotation.x = Math.PI / 2; 
    coin.current.castShadow = true; 
    coin.current.receiveShadow = true; 
    scene.current.add(coin.current); 
    const groundGeometry = new THREE.PlaneGeometry(5,5); 
    const groundMaterial = new THREE.ShadowMaterial({opacity: 0.3}); 
    const ground = new THREE.Mesh(groundGeometry, groundMaterial); 
    ground.rotation.x = -Math.PI / 2; 
    ground.position.y = -coinRadius - 0.1; 
    ground.receiveShadow = true; 
    scene.current.add(ground); 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
    scene.current.add(ambientLight); 
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight.position.set(2, 3, 2); 
    directionalLight.castShadow = true; 
    scene.current.add(directionalLight); 
    const animate = () => { 
      animationFrameId.current = requestAnimationFrame(animate); 
      if (isAnimating.current && coin.current) { 
        coin.current.rotation.y += rotationSpeed.current; 
        coin.current.rotation.x += rotationSpeed.current * 0.3; 
        rotationSpeed.current *= 0.985; 
        if (rotationSpeed.current < 0.005) { 
          isAnimating.current = false; 
          rotationSpeed.current = 0; 
          coin.current.rotation.x = Math.PI / 2; 
          coin.current.rotation.y = targetRotationY.current; 
          const finalOutcome = (targetRotationY.current === 0 || targetRotationY.current === 2 * Math.PI) ? 'Heads' : 'Tails'; 
          let winnerId; 
          if (coupleData.status === "active_testing") { winnerId = userId; } 
          else { winnerId = Object.keys(playerAssignments).find(uid => playerAssignments[uid] === finalOutcome); } 
          const activityMessage = `Landed on ${finalOutcome}! ${winnerId === userId ? 'You' : getUserDisplayName(winnerId, coupleData)} won!`; 
          onUpdateActivity({ ...activity.data, tossResult: finalOutcome, winnerId: winnerId, message: activityMessage, showContinueButton: true }); 
        }
      } 
      renderer.current.render(scene.current, camera.current); 
    }; 
    const handleResize = () => { 
      if (currentCanvas && camera.current && renderer.current) { 
        const newWidth = currentCanvas.clientWidth; 
        const newHeight = Math.max(150, currentCanvas.clientHeight); 
        camera.current.aspect = newWidth / newHeight; 
        camera.current.updateProjectionMatrix(); 
        renderer.current.setSize(newWidth, newHeight); 
      }
    }; 
    if (!activity.data?.tossResult) { 
      if(coin.current) coin.current.rotation.y = Math.random() * Math.PI * 2; 
    } else { 
      if(coin.current) coin.current.rotation.y = activity.data.tossResult === 'Heads' ? 0 : Math.PI; 
    } 
    handleResize(); 
    animate(); 
    return () => { 
      window.removeEventListener('resize', handleResize); 
      cancelAnimationFrame(animationFrameId.current); 
      if(renderer.current) renderer.current.dispose(); 
    }; 
  }, [activity.data?.playerAssignments, coupleData, userId, onUpdateActivity]); 

  const getUserDisplayName = (uid, cplData) => { 
    if (!cplData) return "Partner"; 
    if (cplData.status === "active_testing" && uid === cplData.user1Id) { 
      return cplData.user1DisplayName?.includes("(P1 Test)") ? cplData.user1DisplayName : cplData.user2DisplayName; 
    } 
    if (uid === cplData.user1Id) return cplData.user1DisplayName || "P1"; 
    if (uid === cplData.user2Id) return cplData.user2DisplayName || "P2"; 
    return "Partner"; 
  }; 

  const handleToss = () => { 
    if (!isMyTurn || activity.data?.tossResult || tossInitiatedByMe || !coin.current) { 
      setMessage(isMyTurn ? "Toss done." : "Not your turn!"); 
      return; 
    } 
    setMessage("Tossing..."); 
    setTossInitiatedByMe(true); 
    isAnimating.current = true; 
    rotationSpeed.current = 0.2 + Math.random() * 0.2; 
    targetRotationY.current = Math.random() < 0.5 ? 0 : Math.PI; 
    onUpdateActivity({ ...activity.data, message: "Coin in air!", showContinueButton: false, turn: userId }); 
  }; 

  const handleContinue = () => { 
    if (!tossResult) { setMessage("Wait for toss."); return; } 
    onEndActivity({ outcome: tossResult, winnerId: activity.data.winnerId, scoreChange: 10, message: activity.data.message }); 
  }; 

  const myAssignment = playerAssignments[userId]; 
  const partnerIdForDisplay = (coupleData?.status === "active_testing") ? userId : (userId === coupleData?.user1Id ? coupleData?.user2Id : coupleData?.user1Id); 
  const partnerAssignment = playerAssignments[partnerIdForDisplay] || (myAssignment === "Heads" ? "Tails" : "Heads");

  return ( 
    <div className="text-center p-4 rounded-lg bg-sky-50 shadow-inner"> 
      <h3 className="text-2xl font-bold mb-3 text-sky-700">Coin Toss!</h3> 
      {myAssignment && <p>You: <span className={`font-bold ${myAssignment === 'Heads' ? 'text-yellow-600' : 'text-gray-600'}`}>{myAssignment}</span></p>} 
      {coupleData?.status !== "active_testing" && partnerAssignment && partnerIdForDisplay && coupleData && <p>Partner ({getUserDisplayName(partnerIdForDisplay, coupleData)}): <span className={`font-bold ${partnerAssignment === 'Heads' ? 'text-yellow-600' : 'text-gray-600'}`}>{partnerAssignment}</span></p>} 
      {coupleData?.status === "active_testing" && <p>Test Mode: Coin has Heads & Tails.</p>} 
      {!tossResult && (<p>{isMyTurn ? "Your turn!" : `Waiting for ${getUserDisplayName(activity.turn, coupleData)}...`}</p>)} 
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto h-48 sm:h-64 md:h-72 bg-sky-200 rounded-lg overflow-hidden shadow-lg my-4 border-2 border-sky-300">
        <canvas ref={canvasRef} className="w-full h-full block"></canvas>
      </div> 
      {!tossResult && isMyTurn && ( <button onClick={handleToss} disabled={(!myAssignment && coupleData?.status !== "active_testing") || tossInitiatedByMe} className="btn-primary"> Toss! </button> )} 
      {tossResult && ( <div className="mt-4 p-3 bg-white rounded shadow"> <p className="text-xl font-semibold">{activity.data?.message}</p> <p className="text-2xl mt-1">Landed: <span className={`font-bold ${tossResult === 'Heads' ? 'text-yellow-600' : 'text-gray-600'}`}>{tossResult}</span></p> </div> )} 
      {showContinueButton && tossResult && ( <button onClick={handleContinue} className="btn-success mt-6"> Continue </button> )} 
      {message && !activity.data?.message && <p className="text-sm text-gray-500 mt-3">{message}</p>} 
    </div> 
  );
};
