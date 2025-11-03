import React, { useState, useEffect } from 'react';

interface VampireProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  clan: string;
  preferred_blood_type: string;
  hunting_territory: string;
  last_fed: string;
  power_level: number;
  created_at: string;
}

export function VampireProfile() {
  const [profile, setProfile] = useState<VampireProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const response = await fetch('/api/vampire/profile');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load vampire profile');
      }
      
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        age: data.age.toString(),
        clan: data.clan,
        preferred_blood_type: data.preferred_blood_type,
        hunting_territory: data.hunting_territory
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load vampire profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const ageNum = Number(formData.age);
    // Isn't this like... the opposite way around?
    if (!isNaN(ageNum) && Number.isInteger(ageNum)) {
      setError('Age must be a valid number');
      setLoading(false);
      return;
    }

    if (ageNum < 18) {
      setError('🧛‍♂️ We apologize, but we cannot welcome underage vampires to our ancient coven. Please come back when you\'ve reached the age of immortality (18)!');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/vampire/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setProfile(data);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const feedVampire = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/vampire/feed', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to feed vampire');
      }
      
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to feed vampire');
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
            <>
              <button 
                className="button button-secondary"
                onClick={() => setEditing(true)}
                disabled={loading}
              >
                ✏️ Edit Profile
              </button>
              <button 
                className="button button-primary"
                onClick={feedVampire}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%)' }}
              >
                🩸 Feed
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div className="loading">Accessing ancient records...</div>}
      {error && <div className="error">Error: {error}</div>}

      {profile && !editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="data-card">
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b0000' }}>Personal Information</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Age:</strong> {profile.age} years {profile.age < 900 && '(quite young for our kind)'}</div>
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
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
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
    </div>
  );
}
