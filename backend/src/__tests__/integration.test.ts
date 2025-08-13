// @ts-nocheck
import request from 'supertest';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { apiRoutes } from '../routes/api';
import { typeDefs, resolvers } from '../graphql/schema';

// Mock database
jest.mock('../database/init', () => ({
  sqlDb: {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
  },
  noSqlDb: new Map()
}));

describe('Integration Tests', () => {
  let app: express.Application;
  let server: ApolloServer;
  let mockSqlDb: any;
  let mockNoSqlDb: any;

  beforeAll(async () => {
    // Setup Express app with GraphQL
    app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);

    // Setup Apollo Server
    server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
    });

    await server.start();
    server.applyMiddleware({ app: app as any, path: '/graphql' });
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    // Get mocked database references
    const { sqlDb, noSqlDb } = require('../database/init');
    mockSqlDb = sqlDb;
    mockNoSqlDb = noSqlDb;
    
    // Reset mocks and data
    jest.clearAllMocks();
    mockNoSqlDb.clear();
    
    // Setup sample blood sacks data
    mockNoSqlDb.set('bloodSacks', [
      {
        id: '1',
        name: 'Integration Test Subject',
        bloodType: 'O-',
        age: 28,
        location: 'Downtown',
        isRecruited: false,
        pricePerPint: 300,
        quality: 'Premium',
        lastSeen: '2024-01-01T00:00:00Z',
        notes: 'Integration test data'
      }
    ]);
  });

  describe('Complete Vampire Workflow', () => {
    it('should authenticate, view profile, and recruit blood sack', async () => {
      // Step 1: Authenticate
      const authResponse = await request(app)
        .post('/api/vampire/authenticate')
        .send({ secretPhrase: 'eternal darkness calls' });

      expect(authResponse.status).toBe(200);
      const { token } = authResponse.body;

      // Step 2: Get vampire profile
      const mockProfile = {
        id: 1,
        name: 'Integration Test Vampire',
        email: 'test@vampire.coven',
        age: 500,
        clan: 'Drăculești',
        preferred_blood_type: 'O-',
        hunting_territory: 'Downtown District',
        power_level: 75
      };

      mockSqlDb.get.mockImplementation((query, callback) => {
        callback(null, mockProfile);
      });

      const profileResponse = await request(app)
        .get('/api/vampire/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body).toEqual(mockProfile);

      // Step 3: Query available blood sacks via GraphQL
      const graphqlQuery = {
        query: `
          query GetBloodSacks($filter: BloodSackFilter) {
            bloodSacks(filter: $filter) {
              id
              name
              bloodType
              isRecruited
              pricePerPint
              quality
            }
          }
        `,
        variables: {
          filter: { recruited: false }
        }
      };

      const bloodSacksResponse = await request(app)
        .post('/graphql')
        .send(graphqlQuery);

      expect(bloodSacksResponse.status).toBe(200);
      const { data } = bloodSacksResponse.body;
      expect(data.bloodSacks).toHaveLength(1);
      expect(data.bloodSacks[0].isRecruited).toBe(false);

      // Step 4: Recruit blood sack via GraphQL
      const recruitMutation = {
        query: `
          mutation RecruitBloodSack($id: ID!) {
            recruitBloodSack(id: $id) {
              id
              name
              isRecruited
              pricePerPint
              recruitedDate
            }
          }
        `,
        variables: { id: '1' }
      };

      const recruitResponse = await request(app)
        .post('/graphql')
        .send(recruitMutation);

      expect(recruitResponse.status).toBe(200);
      const recruitData = recruitResponse.body.data;
      expect(recruitData.recruitBloodSack.isRecruited).toBe(true);
      expect(recruitData.recruitBloodSack.pricePerPint).toBe(0);
      expect(recruitData.recruitBloodSack.recruitedDate).toBeDefined();

      // Step 5: Verify blood sack is now recruited
      const verifyResponse = await request(app)
        .post('/graphql')
        .send(graphqlQuery);

      expect(verifyResponse.status).toBe(200);
      const verifyData = verifyResponse.body.data;
      expect(verifyData.bloodSacks).toHaveLength(0); // No unrecruitedblood sacks left
    });

    it('should handle feeding workflow', async () => {
      // Authenticate
      const authResponse = await request(app)
        .post('/api/vampire/authenticate')
        .send({ secretPhrase: 'eternal darkness calls' });

      const { token } = authResponse.body;

      // Mock initial profile
      const initialProfile = {
        id: 1,
        name: 'Hungry Vampire',
        power_level: 20,
        last_fed: '2024-01-01T00:00:00Z'
      };

      // Mock updated profile after feeding
      const fedProfile = {
        ...initialProfile,
        power_level: 30,
        last_fed: '2024-01-15T12:00:00Z'
      };

      // Setup mock responses
      let callCount = 0;
      mockSqlDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 }, null);
      });

      mockSqlDb.get.mockImplementation((query, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, initialProfile);
        } else {
          callback(null, fedProfile);
        }
      });

      // Get initial profile
      const initialResponse = await request(app)
        .get('/api/vampire/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(initialResponse.body.power_level).toBe(20);

      // Feed vampire
      const feedResponse = await request(app)
        .post('/api/vampire/feed')
        .set('Authorization', `Bearer ${token}`);

      expect(feedResponse.status).toBe(200);
      expect(feedResponse.body.power_level).toBe(30);

      // Verify feeding history was recorded
      const mockHistory = [
        {
          id: 1,
          vampire_id: 1,
          fed_at: '2024-01-15T12:00:00Z',
          power_gained: 10,
          location: 'Unknown Location',
          notes: 'Regular feeding'
        }
      ];

      mockSqlDb.all.mockImplementation((query, callback) => {
        callback(null, mockHistory);
      });

      const historyResponse = await request(app)
        .get('/api/vampire/feeding-history')
        .set('Authorization', `Bearer ${token}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body).toHaveLength(1);
      expect(historyResponse.body[0].power_gained).toBe(10);
    });

    it('should handle complex blood sack management workflow', async () => {
      // Add a new blood sack via GraphQL
      const addMutation = {
        query: `
          mutation AddBloodSack($input: BloodSackInput!) {
            addBloodSack(input: $input) {
              id
              name
              bloodType
              age
              location
              quality
              isRecruited
              pricePerPint
            }
          }
        `,
        variables: {
          input: {
            name: 'Workflow Test Subject',
            bloodType: 'AB-',
            age: 35,
            location: 'University District',
            quality: 'Good',
            notes: 'Perfect for recruitment'
          }
        }
      };

      const addResponse = await request(app)
        .post('/graphql')
        .send(addMutation);

      expect(addResponse.status).toBe(200);
      const addedSack = addResponse.body.data.addBloodSack;
      expect(addedSack.name).toBe('Workflow Test Subject');
      expect(addedSack.isRecruited).toBe(false);
      expect(addedSack.pricePerPint).toBe(216); // AB- (180) * Good (1.2) = 216

      // Query all blood sacks with filtering
      const queryWithFilter = {
        query: `
          query GetBloodSacks($filter: BloodSackFilter) {
            bloodSacks(filter: $filter) {
              id
              name
              bloodType
              quality
              location
              isRecruited
            }
          }
        `,
        variables: {
          filter: {
            bloodType: 'AB-',
            quality: 'Good',
            location: 'University District'
          }
        }
      };

      const filterResponse = await request(app)
        .post('/graphql')
        .send(queryWithFilter);

      expect(filterResponse.status).toBe(200);
      const filteredSacks = filterResponse.body.data.bloodSacks;
      expect(filteredSacks).toHaveLength(1);
      expect(filteredSacks[0].name).toBe('Workflow Test Subject');

      // Recruit the new blood sack
      const recruitMutation = {
        query: `
          mutation RecruitBloodSack($id: ID!) {
            recruitBloodSack(id: $id) {
              id
              isRecruited
              recruitedDate
              pricePerPint
            }
          }
        `,
        variables: { id: addedSack.id }
      };

      const recruitResponse = await request(app)
        .post('/graphql')
        .send(recruitMutation);

      expect(recruitResponse.status).toBe(200);
      const recruitedSack = recruitResponse.body.data.recruitBloodSack;
      expect(recruitedSack.isRecruited).toBe(true);
      expect(recruitedSack.pricePerPint).toBe(0);
      expect(recruitedSack.recruitedDate).toBeDefined();

      // Verify the filter now returns empty for unrecruitedblood sacks
      const verifyUnrecruitedQuery = {
        ...queryWithFilter,
        variables: {
          filter: {
            ...queryWithFilter.variables.filter,
            recruited: false
          }
        }
      };

      const verifyResponse = await request(app)
        .post('/graphql')
        .send(verifyUnrecruitedQuery);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.bloodSacks).toHaveLength(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Authenticate
      const authResponse = await request(app)
        .post('/api/vampire/authenticate')
        .send({ secretPhrase: 'eternal darkness calls' });

      const { token } = authResponse.body;

      // Mock database error
      mockSqlDb.get.mockImplementation((query, callback) => {
        callback(new Error('Database connection lost'), null);
      });

      const response = await request(app)
        .get('/api/vampire/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection lost');
    });

    it('should handle GraphQL validation errors', async () => {
      const invalidMutation = {
        query: `
          mutation AddBloodSack($input: BloodSackInput!) {
            addBloodSack(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name: 'X', // Too short
            bloodType: 'INVALID',
            age: 10, // Too young
            location: 'Invalid Location',
            quality: 'Bad Quality'
          }
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(invalidMutation);

      expect(response.status).toBe(200); // GraphQL returns 200 but with errors
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Name must be at least 2 characters');
    });

    it('should handle authentication errors across different endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/vampire/profile' },
        { method: 'put', path: '/api/vampire/profile' },
        { method: 'post', path: '/api/vampire/feed' },
        { method: 'get', path: '/api/vampire/feeding-history' },
        { method: 'post', path: '/api/vampire/profile-picture' }
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app) as any)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Access denied');
      }
    });
  });
});
