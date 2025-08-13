import React from 'react';

interface ErrorMessageProps {
  error: string | Error | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, title = 'Error', onRetry, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div style={{
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      color: '#721c24',
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>
            ⚠️ {title}
          </h4>
          <p style={{ margin: '0', lineHeight: '1.4' }}>
            {errorMessage}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                background: 'transparent',
                color: '#721c24',
                border: '1px solid #721c24',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

