// @ts-nocheck
import request from 'supertest';
import express from 'express';
import { apiRoutes } from '../routes/api';
import sqlite3 from 'sqlite3';

// Mock the database
jest.mock('../database/init', () => ({
  sqlDb: {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
  },
  noSqlDb: new Map()
}));

describe('API Routes', () => {
  let app: express.Application;
  let mockSqlDb: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);
    
    // Get mocked database reference
    const { sqlDb } = require('../database/init');
    mockSqlDb = sqlDb;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    describe('POST /api/vampire/authenticate', () => {
      it('should return token for correct secret phrase', async () => {
        const response = await request(app)
          .post('/api/vampire/authenticate')
          .send({ secretPhrase: 'eternal darkness calls' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token', 'VAMPIRE_ETERNAL_ACCESS_TOKEN_1347');
        expect(response.body).toHaveProperty('message', 'Welcome to the coven, eternal one.');
        expect(response.body).toHaveProperty('expiresIn', 'Never (you are immortal)');
      });

      it('should reject incorrect secret phrase', async () => {
        const response = await request(app)
          .post('/api/vampire/authenticate')
          .send({ secretPhrase: 'wrong phrase' });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Incorrect secret phrase');
        expect(response.body).toHaveProperty('hint');
      });

      it('should reject missing secret phrase', async () => {
        const response = await request(app)
          .post('/api/vampire/authenticate')
          .send({});

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Protected Routes', () => {
    const validToken = 'VAMPIRE_ETERNAL_ACCESS_TOKEN_1347';
    const authHeader = `Bearer ${validToken}`;

    describe('GET /api/vampire/profile', () => {
      it('should return profile data for authenticated user', async () => {
        const mockProfile = {
          id: 1,
          name: 'Lord Darkwood',
          email: 'darkwood@eternal.coven',
          age: 847,
          clan: 'Drăculești',
          preferred_blood_type: 'O-',
          hunting_territory: 'Downtown District'
        };

        mockSqlDb.get.mockImplementation((query: any, callback: any) => {
          callback(null, mockProfile);
        });

        const response = await request(app)
          .get('/api/vampire/profile')
          .set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProfile);
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .get('/api/vampire/profile');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Access denied');
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/vampire/profile')
          .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid vampire credentials');
      });

      it('should handle database errors gracefully', async () => {
        mockSqlDb.get.mockImplementation((query, callback) => {
          callback(new Error('Database connection failed'), null);
        });

        const response = await request(app)
          .get('/api/vampire/profile')
          .set('Authorization', authHeader);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Database connection failed');
      });

      it('should handle missing profile', async () => {
        mockSqlDb.get.mockImplementation((query, callback) => {
          callback(null, null);
        });

        const response = await request(app)
          .get('/api/vampire/profile')
          .set('Authorization', authHeader);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Vampire profile not found');
      });
    });

    describe('PUT /api/vampire/profile', () => {
      const validProfileData = {
        name: 'Updated Lord Darkwood',
        email: 'updated@eternal.coven',
        age: 850,
        clan: 'Drăculești',
        preferred_blood_type: 'AB-',
        hunting_territory: 'University District'
      };

      it('should update profile with valid data', async () => {
        const updatedProfile = { id: 1, ...validProfileData };

        mockSqlDb.run.mockImplementation((query, params, callback) => {
          callback.call({ changes: 1 }, null);
        });

        mockSqlDb.get.mockImplementation((query, callback) => {
          callback(null, updatedProfile);
        });

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(validProfileData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedProfile);
      });

      it('should reject requests without authentication', async () => {
        const response = await request(app)
          .put('/api/vampire/profile')
          .send(validProfileData);

        expect(response.status).toBe(401);
      });

      it('should validate required fields', async () => {
        const invalidData: any = { ...validProfileData };
        delete invalidData.name;

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should validate age range', async () => {
        const invalidData = { ...validProfileData, age: 10 };

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Age must be between 18 and 5000');
      });

      it('should validate email format', async () => {
        const invalidData = { ...validProfileData, email: 'invalid-email' };

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid email format');
      });

      it('should validate clan', async () => {
        const invalidData = { ...validProfileData, clan: 'Invalid Clan' };

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid clan');
      });

      it('should validate blood type', async () => {
        const invalidData = { ...validProfileData, preferred_blood_type: 'Z+' };

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid preferred blood type');
      });

      it('should trim and validate name length', async () => {
        const invalidData = { ...validProfileData, name: ' X ' };

        const response = await request(app)
          .put('/api/vampire/profile')
          .set('Authorization', authHeader)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Name must be at least 2 characters');
      });
    });

    describe('POST /api/vampire/feed', () => {
      it('should successfully feed vampire', async () => {
        const mockUpdatedProfile = {
          id: 1,
          name: 'Lord Darkwood',
          power_level: 95,
          last_fed: '2024-01-15T12:00:00Z'
        };

        mockSqlDb.run.mockImplementation((query, params, callback) => {
          callback.call({ changes: 1 }, null);
        });

        mockSqlDb.get.mockImplementation((query, callback) => {
          callback(null, mockUpdatedProfile);
        });

        const response = await request(app)
          .post('/api/vampire/feed')
          .set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUpdatedProfile);
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/vampire/feed');

        expect(response.status).toBe(401);
      });

      it('should handle database errors', async () => {
        mockSqlDb.run.mockImplementation((query, params, callback) => {
          callback(new Error('Database error'), null);
        });

        const response = await request(app)
          .post('/api/vampire/feed')
          .set('Authorization', authHeader);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Database error');
      });
    });

    describe('POST /api/vampire/profile-picture', () => {
      const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      it('should upload valid profile picture', async () => {
        const mockUpdatedProfile = {
          id: 1,
          name: 'Lord Darkwood',
          profile_picture: validBase64Image
        };

        mockSqlDb.run.mockImplementation((query, params, callback) => {
          callback.call({ changes: 1 }, null);
        });

        mockSqlDb.get.mockImplementation((query, callback) => {
          callback(null, mockUpdatedProfile);
        });

        const response = await request(app)
          .post('/api/vampire/profile-picture')
          .set('Authorization', authHeader)
          .send({ profilePicture: validBase64Image });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUpdatedProfile);
      });

      it('should reject non-image data', async () => {
        const response = await request(app)
          .post('/api/vampire/profile-picture')
          .set('Authorization', authHeader)
          .send({ profilePicture: 'data:text/plain;base64,dGVzdA==' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid image format');
      });

      it('should reject missing profile picture', async () => {
        const response = await request(app)
          .post('/api/vampire/profile-picture')
          .set('Authorization', authHeader)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Profile picture data is required');
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/vampire/profile-picture')
          .send({ profilePicture: validBase64Image });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/vampire/feeding-history', () => {
      it('should return feeding history for authenticated user', async () => {
        const mockHistory = [
          {
            id: 1,
            vampire_id: 1,
            fed_at: '2024-01-01T00:00:00Z',
            power_gained: 10,
            location: 'Downtown',
            notes: 'Good hunt'
          }
        ];

        mockSqlDb.all.mockImplementation((query, callback) => {
          callback(null, mockHistory);
        });

        const response = await request(app)
          .get('/api/vampire/feeding-history')
          .set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockHistory);
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .get('/api/vampire/feeding-history');

        expect(response.status).toBe(401);
      });

      it('should handle empty history', async () => {
        mockSqlDb.all.mockImplementation((query, callback) => {
          callback(null, []);
        });

        const response = await request(app)
          .get('/api/vampire/feeding-history')
          .set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });
  });
});
