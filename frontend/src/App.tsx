import React, { useState } from 'react'
import { VampireProfile } from './components/VampireProfile'
import { BloodSacks } from './components/BloodSacks'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { LoginForm } from './components/LoginForm'
import './App.css'

type Tab = 'profile' | 'bloodsacks';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { isAuthenticated } = useAuth();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <VampireProfile />;
      case 'bloodsacks':
        return <BloodSacks />;
      default:
        return <VampireProfile />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧛‍♂️ Vampiric Operations Command Center</h1>
        <p>Manage your eternal existence and hunt for fresh blood</p>
      </header>

      <LoginForm />

      {isAuthenticated && (
        <>
          <nav className="app-nav">
            <button 
              className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              🧛‍♂️ My Profile
            </button>
            <button 
              className={`nav-button ${activeTab === 'bloodsacks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bloodsacks')}
            >
              🩸 Blood Sacks
            </button>
          </nav>

          <main className="app-main">
            <ErrorBoundary>
              {renderTabContent()}
            </ErrorBoundary>
          </main>
        </>
      )}

      <footer className="app-footer">
        <p>REST for Profile • GraphQL for Blood Sacks • SQL + NoSQL • Est. 1347 AD</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
