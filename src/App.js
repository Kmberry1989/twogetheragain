import React, { useState, useEffect } from 'react';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { CoupleProvider } from './contexts/CoupleContext';
import HomePage from './pages/HomePage';
import ActivitiesPage from './pages/ActivitiesPage';
import JournalPage from './pages/JournalPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    document.body.style.fontFamily = "'Inter', sans-serif"; 
    document.body.classList.add('bg-gradient-to-br', 'from-pink-50', 'via-purple-50', 'to-indigo-50', 'min-h-screen', 'transition-all', 'duration-500');
    
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');`;
    document.head.appendChild(styleSheet);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'activities':
        return <ActivitiesPage onNavigate={navigateTo} />;
      case 'journal':
        return <JournalPage onNavigate={navigateTo} />;
      case 'home':
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <FirebaseProvider>
      <CoupleProvider>
        <div className="antialiased text-gray-800">
          {renderPage()}
        </div>
      </CoupleProvider>
    </FirebaseProvider>
  );
}

export default App;