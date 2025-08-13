import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ConfirmationDialog } from './ConfirmationDialog';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface VampireProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  clan: string;
  preferred_blood_type: string;
  hunting_territory: string;
  profile_picture?: string;
  last_fed: string;
  power_level: number;
  created_at: string;
}

interface FeedingHistoryEntry {
  id: number;
  vampire_id: number;
  fed_at: string;
  power_gained: number;
  location: string;
  notes: string;
}

export function VampireProfile() {
  const [profile, setProfile] = useState<VampireProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedingHistory, setFeedingHistory] = useState<FeedingHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedConfirm, setShowFeedConfirm] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    clan: '',
    preferred_blood_type: '',
    hunting_territory: ''
  });

  const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const clans = ['Drăculești', 'Bathory', 'Karnstein', 'LeStat', 'Nosferatu'];

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/vampire/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        age: response.data.age.toString(),
        clan: response.data.clan,
        preferred_blood_type: response.data.preferred_blood_type,
        hunting_territory: response.data.hunting_territory
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load vampire profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        ...formData,
        age: parseInt(formData.age)
      };
      
      const response = await axios.put('/api/vampire/profile', updateData);
      setProfile(response.data);
      // Keep form in sync with persisted values
      setFormData({
        name: response.data.name,
        email: response.data.email,
        age: response.data.age.toString(),
        clan: response.data.clan,
        preferred_blood_type: response.data.preferred_blood_type,
        hunting_territory: response.data.hunting_territory
      });
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedingHistory = async () => {
    try {
      const response = await axios.get('/api/vampire/feeding-history');
      setFeedingHistory(response.data);
    } catch (err: any) {
      console.error('Failed to load feeding history:', err);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    setUploadingPicture(true);
    setError(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const response = await axios.post('/api/vampire/profile-picture', {
            profilePicture: base64String
          });
          setProfile(response.data);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to upload profile picture');
        } finally {
          setUploadingPicture(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError('Failed to process image file');
      setUploadingPicture(false);
    }
  };

  const feedVampire = async () => {
    setLoading(true);
    setError(null);
    setShowFeedConfirm(false);
    
    try {
      const response = await axios.post('/api/vampire/feed');
      setProfile(response.data);
      // Refresh feeding history after feeding
      if (showHistory) {
        fetchFeedingHistory();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to feed vampire');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const daysSinceLastFed = profile ? 
    Math.floor((new Date().getTime() - new Date(profile.last_fed).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="component-container">
      <div className="component-header">
        <h2 className="component-title">🧛‍♂️ Vampire Profile</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!editing && (
            <button 
              className="button button-secondary"
              onClick={() => setEditing(true)}
              disabled={loading}
            >
              ✏️ Edit Profile
            </button>
          )}
          <button 
            className="button button-primary"
            onClick={() => setShowFeedConfirm(true)}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%)' }}
          >
            🩸 Feed
          </button>
          <button 
            className="button button-secondary"
            onClick={async () => {
              setShowHistory(!showHistory);
              if (!showHistory && feedingHistory.length === 0) {
                await fetchFeedingHistory();
              }
            }}
            disabled={loading}
          >
            📜 {showHistory ? 'Hide' : 'Show'} Feeding History
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Accessing ancient records..." />}
      <ErrorMessage 
        error={error} 
        title="Profile Error" 
        onRetry={fetchProfile}
        onDismiss={() => setError(null)}
      />

      {profile && !editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: '2rem' }}>
          {/* Profile Picture */}
          <div className="data-card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>Portrait</h3>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={profile.profile_picture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjhmOWZhIi8+CjxwYXRoIGQ9Ik0xMDAgMTAwQzExNi41NjkgMTAwIDEzMCA4Ni41Njg1IDEzMCA3MEMxMzAgNTMuNDMxNSAxMTYuNTY5IDQwIDEwMCA0MEM4My40MzE1IDQwIDcwIDUzLjQzMTUgNzAgNzBDNzAgODYuNTY4NSA4My40MzE1IDEwMCAxMDAgMTAwWiIgZmlsbD0iIzZjNzU3ZCIvPgo8cGF0aCBkPSJNMTcwIDIwMFY4MEM5NDEgOTUgOTQwIDEwNSA0MCA4MFYyMDBIMTcwWiIgZmlsbD0iIzZjNzU3ZCIvPgo8L3N2Zz4K'}
                alt="Vampire Portrait"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '2px solid #8b0000'
                }}
              />
              {uploadingPicture && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  🔄 Uploading...
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      setError('Image too large. Maximum size is 2MB.');
                      return;
                    }
                    uploadProfilePicture(file);
                  }
                }}
                style={{ display: 'none' }}
                id="profile-picture-upload"
                disabled={uploadingPicture}
              />
              <label
                htmlFor="profile-picture-upload"
                className="button button-secondary"
                style={{
                  cursor: uploadingPicture ? 'not-allowed' : 'pointer',
                  opacity: uploadingPicture ? 0.6 : 1
                }}
              >
                📸 {profile.profile_picture ? 'Change Portrait' : 'Upload Portrait'}
              </label>
            </div>
          </div>

          <div className="data-card">
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>Personal Information</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Age:</strong> {profile.age} years (quite young for our kind)</div>
              <div><strong>Clan:</strong> House {profile.clan}</div>
              <div><strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="data-card">
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>Hunting Preferences</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Preferred Blood Type:</strong> {profile.preferred_blood_type}</div>
              <div><strong>Territory:</strong> {profile.hunting_territory}</div>
              <div><strong>Power Level:</strong> {profile.power_level}/100</div>
              <div style={{
                color: daysSinceLastFed > 7 ? '#dc3545' : daysSinceLastFed > 3 ? '#ffc107' : '#28a745'
              }}>
                <strong>Last Fed:</strong> {daysSinceLastFed} days ago
                {daysSinceLastFed > 7 && ' (Dangerously hungry!)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feeding History */}
      {showHistory && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>📜 Feeding History</h3>
          {feedingHistory.length === 0 ? (
            <div className="data-card" style={{ textAlign: 'center', color: '#666' }}>
              No feeding history recorded yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {feedingHistory.map((entry) => (
                <div key={entry.id} className="data-card" style={{ 
                  borderLeft: '4px solid #8b0000',
                  background: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {new Date(entry.fed_at).toLocaleDateString()} at {new Date(entry.fed_at).toLocaleTimeString()}
                    </div>
                    <div style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: '#d4edda',
                      color: '#155724'
                    }}>
                      +{entry.power_gained} Power
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
                    <div><strong>📍 Location:</strong> {entry.location}</div>
                    {entry.notes && (
                      <div><strong>📝 Notes:</strong> <em>{entry.notes}</em></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={updateProfile} style={{ maxWidth: '600px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Name:</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email:</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age (years):</label>
              <input
                type="number"
                className="form-input"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                min="18"
                max="5000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clan:</label>
              <select
                className="form-input"
                value={formData.clan}
                onChange={(e) => setFormData({ ...formData, clan: e.target.value })}
                required
              >
                <option value="">Select a clan...</option>
                {clans.map(clan => (
                  <option key={clan} value={clan}>{clan}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Blood Type:</label>
              <select
                className="form-input"
                value={formData.preferred_blood_type}
                onChange={(e) => setFormData({ ...formData, preferred_blood_type: e.target.value })}
                required
              >
                <option value="">Select blood type...</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hunting Territory:</label>
              <input
                type="text"
                className="form-input"
                value={formData.hunting_territory}
                onChange={(e) => setFormData({ ...formData, hunting_territory: e.target.value })}
                placeholder="e.g., Downtown District, University Campus"
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button 
              type="submit" 
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
            <button 
              type="button"
              className="button button-secondary"
              onClick={() => setEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e9ecef', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
        <strong>Technology:</strong> REST API with SQL Database (SQLite) | Profile management and settings
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showFeedConfirm}
        title="🩸 Confirm Feeding"
        message={`Are you sure you want to feed? This will restore your power and update your last fed time. ${
          profile && daysSinceLastFed > 7 
            ? 'You are dangerously hungry - feeding is highly recommended!' 
            : 'This action cannot be undone.'
        }`}
        confirmText="🩸 Feed Now"
        cancelText="Cancel"
        onConfirm={feedVampire}
        onCancel={() => setShowFeedConfirm(false)}
        danger={profile ? daysSinceLastFed <= 3 : false}
      />
    </div>
  );
}
