import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { ErrorMessage } from './ErrorMessage';

export function LoginForm() {
  const [secretPhrase, setSecretPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, authError, logout, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(secretPhrase);
    if (success) {
      setSecretPhrase('');
    }
    
    setLoading(false);
  };

  if (isAuthenticated) {
    return (
      <div style={{
        background: '#d4edda',
        border: '1px solid #c3e6cb',
        color: '#155724',
        padding: '1rem',
        borderRadius: '8px',
        margin: '1rem 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>🧛‍♂️ Authenticated</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Welcome, eternal one. You have access to the ancient vampire records.
            </p>
          </div>
          <button
            onClick={logout}
            className="button button-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      color: '#856404',
      padding: '1.5rem',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>
        🔒 Vampire Authentication Required
      </h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
        To access vampire records, you must authenticate with the ancient secret phrase.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Secret Phrase:
          </label>
          <input
            type="password"
            value={secretPhrase}
            onChange={(e) => setSecretPhrase(e.target.value)}
            placeholder="Whisper the ancient words..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="button button-primary"
          disabled={loading || !secretPhrase.trim()}
          style={{
            background: loading ? '#ccc' : 'linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%)',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄' : '🦇'} Authenticate
        </button>
      </form>

      <ErrorMessage error={authError} title="Authentication Error" />

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        background: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <strong>Hint:</strong> The phrase that calls the eternal darkness...
      </div>
    </div>
  );
}

