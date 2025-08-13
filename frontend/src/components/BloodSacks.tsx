import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { ConfirmationDialog } from './ConfirmationDialog';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const GET_BLOOD_SACKS = gql`
  query GetBloodSacks($filter: BloodSackFilter) {
    bloodSacks(filter: $filter) {
      id
      name
      bloodType
      age
      location
      isRecruited
      recruitedDate
      pricePerPint
      quality
      lastSeen
      notes
    }
  }
`;

const RECRUIT_BLOOD_SACK = gql`
  mutation RecruitBloodSack($id: ID!) {
    recruitBloodSack(id: $id) {
      id
      name
      isRecruited
      recruitedDate
      pricePerPint
    }
  }
`;

const ADD_BLOOD_SACK = gql`
  mutation AddBloodSack($input: BloodSackInput!) {
    addBloodSack(input: $input) {
      id
      name
      bloodType
      age
      location
      isRecruited
      pricePerPint
      quality
      notes
    }
  }
`;

interface BloodSack {
  id: string;
  name: string;
  bloodType: string;
  age: number;
  location: string;
  isRecruited: boolean;
  recruitedDate?: string;
  pricePerPint: number;
  quality: string;
  lastSeen: string;
  notes: string;
}

interface BloodSackFilter {
  bloodType?: string;
  recruited?: boolean;
  quality?: string;
  location?: string;
}

export function BloodSacks() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<BloodSackFilter>({});
  const [sortBy, setSortBy] = useState<'name' | 'pricePerPint' | 'quality' | 'lastSeen' | 'age'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [recruitConfirm, setRecruitConfirm] = useState<{ show: boolean; sack: BloodSack | null }>({ show: false, sack: null });
  const [formData, setFormData] = useState({
    name: '',
    bloodType: '',
    age: '',
    location: '',
    quality: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const qualities = ['Premium', 'Good', 'Average', 'Poor'];
  const locations = ['Downtown', 'University District', 'Business District', 'Suburbs', 'Industrial Area'];

  // GraphQL queries and mutations
  const { loading, error, data } = useQuery(GET_BLOOD_SACKS, {
    variables: { filter: filters }
  });
  
  const [recruitBloodSack, { loading: recruitLoading }] = useMutation(RECRUIT_BLOOD_SACK, {
    refetchQueries: [{ query: GET_BLOOD_SACKS, variables: { filter: filters } }]
  });

  const [addBloodSack, { loading: addLoading }] = useMutation(ADD_BLOOD_SACK, {
    refetchQueries: [{ query: GET_BLOOD_SACKS, variables: { filter: filters } }]
  });

  const handleRecruit = async (id: string) => {
    try {
      await recruitBloodSack({ variables: { id } });
      setRecruitConfirm({ show: false, sack: null });
    } catch (error) {
      console.error('Failed to recruit blood sack:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const errors: { [key: string]: string } = {};
    const trimmedName = formData.name.trim();
    const ageNumber = parseInt(formData.age, 10);

    if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!bloodTypes.includes(formData.bloodType)) {
      errors.bloodType = 'Select a valid blood type';
    }
    if (Number.isNaN(ageNumber)) {
      errors.age = 'Age is required';
    } else if (ageNumber < 18 || ageNumber > 100) {
      errors.age = 'Age must be between 18 and 100';
    }
    if (!locations.includes(formData.location)) {
      errors.location = 'Select a valid location';
    }
    if (formData.quality && !qualities.includes(formData.quality)) {
      errors.quality = 'Select a valid quality';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      const input = {
        ...formData,
        name: trimmedName,
        age: ageNumber
      };

      await addBloodSack({ variables: { input } });
      
      setFormData({
        name: '',
        bloodType: '',
        age: '',
        location: '',
        quality: '',
        notes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add blood sack:', error);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Sort and filter blood sacks
  let bloodSacks = data?.bloodSacks || [];
  
  // Apply search filter
  if (searchTerm.trim()) {
    bloodSacks = bloodSacks.filter((sack: BloodSack) => 
      sack.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply sorting
  bloodSacks = [...bloodSacks].sort((a: BloodSack, b: BloodSack) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    // Handle special cases for sorting
    if (sortBy === 'lastSeen') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortBy === 'quality') {
      const qualityOrder = { 'Premium': 4, 'Good': 3, 'Average': 2, 'Poor': 1 };
      aValue = qualityOrder[aValue as keyof typeof qualityOrder] || 0;
      bValue = qualityOrder[bValue as keyof typeof qualityOrder] || 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  const recruitedCount = bloodSacks.filter((sack: BloodSack) => sack.isRecruited).length;
  const totalValue = bloodSacks.reduce((sum: number, sack: BloodSack) => 
    sum + (sack.isRecruited ? 0 : sack.pricePerPint), 0);

  return (
    <div className="component-container">
      <div className="component-header">
        <h2 className="component-title">🩸 Blood Sacks Registry</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Track New Mortal'}
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        background: '#fff', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <div>
          <input
            type="text"
            placeholder="🔍 Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem' }}
          >
            <option value="name">Name</option>
            <option value="pricePerPint">Price</option>
            <option value="quality">Quality</option>
            <option value="lastSeen">Last Seen</option>
            <option value="age">Age</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{ 
              padding: '0.4rem 0.8rem', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              background: '#f8f9fa',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Blood Type:</label>
          <select
            value={filters.bloodType || ''}
            onChange={(e) => setFilters({ ...filters, bloodType: e.target.value || undefined })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Types</option>
            {bloodTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status:</label>
          <select
            value={filters.recruited !== undefined ? filters.recruited.toString() : ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              recruited: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Status</option>
            <option value="true">Recruited</option>
            <option value="false">Available</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quality:</label>
          <select
            value={filters.quality || ''}
            onChange={(e) => setFilters({ ...filters, quality: e.target.value || undefined })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Qualities</option>
            {qualities.map(quality => (
              <option key={quality} value={quality}>{quality}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location:</label>
          <select
            value={filters.location || ''}
            onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button 
            onClick={clearFilters}
            className="button button-secondary"
            style={{ width: '100%' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Name:</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {formErrors.name && <div className="error" style={{ fontSize: '0.8rem' }}>{formErrors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Blood Type:</label>
              <select
                className="form-input"
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                required
              >
                <option value="">Select type...</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {formErrors.bloodType && <div className="error" style={{ fontSize: '0.8rem' }}>{formErrors.bloodType}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Age:</label>
              <input
                type="number"
                className="form-input"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                min="18"
                max="100"
                required
              />
              {formErrors.age && <div className="error" style={{ fontSize: '0.8rem' }}>{formErrors.age}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Location:</label>
              <select
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="">Select location...</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {formErrors.location && <div className="error" style={{ fontSize: '0.8rem' }}>{formErrors.location}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Quality:</label>
              <select
                className="form-input"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              >
                <option value="">Assess quality...</option>
                {qualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
              {formErrors.quality && <div className="error" style={{ fontSize: '0.8rem' }}>{formErrors.quality}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Notes:</label>
              <input
                type="text"
                className="form-input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special observations..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="button button-primary"
            disabled={addLoading}
            style={{ 
              marginTop: '1rem',
              background: addLoading ? '#ccc' : undefined,
              cursor: addLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {addLoading ? '🔄 Adding to Registry...' : 'Add to Registry'}
          </button>
        </form>
      )}

      {loading && <LoadingSpinner message="Scanning the mortal population..." />}
      <ErrorMessage 
        error={error?.message || null} 
        title="Blood Sacks Error" 
        onRetry={() => window.location.reload()}
        onDismiss={() => {}} 
      />

      {/* Summary */}
      {bloodSacks.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#666' }}>
          <span>👥 Total Tracked: {bloodSacks.length}</span>
          <span>🧛‍♂️ Recruited: {recruitedCount}</span>
          <span>💰 Available Value: ${totalValue.toFixed(2)}</span>
        </div>
      )}

      {/* Blood Sacks Grid */}
      {bloodSacks && (
        <div className="data-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {bloodSacks.map((sack: BloodSack) => (
            <div key={sack.id} className="data-card" style={{
              borderLeft: `4px solid ${sack.isRecruited ? '#28a745' : '#dc3545'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{sack.name}</h3>
                {sack.isRecruited ? (
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    background: '#d4edda',
                    color: '#155724'
                  }}>
                    RECRUITED
                  </span>
                ) : (
                  <button
                    onClick={() => setRecruitConfirm({ show: true, sack })}
                    disabled={recruitLoading}
                    className="button button-primary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.25rem 0.5rem',
                      background: recruitLoading ? '#ccc' : 'linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%)',
                      cursor: recruitLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {recruitLoading ? '🔄 Recruiting...' : 'Recruit'}
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
                <div><strong>🩸 Blood Type:</strong> {sack.bloodType}</div>
                <div><strong>👤 Age:</strong> {sack.age} years</div>
                <div><strong>📍 Location:</strong> {sack.location}</div>
                <div><strong>⭐ Quality:</strong> {sack.quality}</div>
                {!sack.isRecruited && (
                  <div><strong>💰 Price:</strong> ${sack.pricePerPint}/pint</div>
                )}
                {sack.isRecruited && sack.recruitedDate && (
                  <div><strong>📅 Recruited:</strong> {new Date(sack.recruitedDate).toLocaleDateString()}</div>
                )}
                <div><strong>👀 Last Seen:</strong> {new Date(sack.lastSeen).toLocaleDateString()}</div>
                {sack.notes && (
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>
                    "{sack.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e9ecef', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
        <strong>Technology:</strong> GraphQL with NoSQL Database (In-memory Maps) | Advanced filtering and real-time updates
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={recruitConfirm.show}
        title="🩸 Confirm Recruitment"
        message={recruitConfirm.sack ? `Are you sure you want to recruit ${recruitConfirm.sack.name}? This will add them to your coven and they will no longer be available for hunting. This action cannot be undone.` : ''}
        confirmText="🧛‍♂️ Recruit"
        cancelText="Cancel"
        onConfirm={() => recruitConfirm.sack && handleRecruit(recruitConfirm.sack.id)}
        onCancel={() => setRecruitConfirm({ show: false, sack: null })}
        danger={true}
      />
    </div>
  );
}
