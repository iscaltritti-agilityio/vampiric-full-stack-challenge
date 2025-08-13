import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          color: danger ? '#dc3545' : '#333',
          fontSize: '1.2rem'
        }}>
          {title}
        </h3>
        
        <p style={{
          margin: '0 0 2rem 0',
          color: '#666',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            className="button button-secondary"
            style={{ minWidth: '80px' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="button button-primary"
            style={{ 
              minWidth: '80px',
              background: danger ? 'linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%)' : undefined
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

