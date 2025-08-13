import { resolvers } from '../graphql/schema';

// Mock the database
jest.mock('../database/init', () => ({
  noSqlDb: new Map()
}));

describe('GraphQL Resolvers', () => {
  let mockNoSqlDb: Map<string, any>;

  beforeEach(() => {
    // Get the mocked database reference
    const { noSqlDb } = require('../database/init');
    mockNoSqlDb = noSqlDb;
    
    // Clear and reset mock data
    mockNoSqlDb.clear();
    
    // Sample blood sacks data for testing
    const sampleBloodSacks = [
      {
        id: '1',
        name: 'Test Subject 1',
        bloodType: 'O-',
        age: 25,
        location: 'Downtown',
        isRecruited: false,
        pricePerPint: 200,
        quality: 'Premium',
        lastSeen: '2024-01-01T00:00:00Z',
        notes: 'Test subject'
      },
      {
        id: '2',
        name: 'Test Subject 2',
        bloodType: 'A+',
        age: 30,
        location: 'University District',
        isRecruited: true,
        recruitedDate: '2024-01-01T00:00:00Z',
        pricePerPint: 0,
        quality: 'Good',
        lastSeen: '2024-01-02T00:00:00Z',
        notes: 'Already recruited'
      }
    ];
    
    mockNoSqlDb.set('bloodSacks', sampleBloodSacks);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Resolvers', () => {
    describe('bloodSacks', () => {
      it('should return all blood sacks when no filter is provided', () => {
        const result = resolvers.Query.bloodSacks(null, {});
        
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Test Subject 1');
        expect(result[1].name).toBe('Test Subject 2');
      });

      it('should filter blood sacks by blood type', () => {
        const result = resolvers.Query.bloodSacks(null, { 
          filter: { bloodType: 'O-' } 
        });
        
        expect(result).toHaveLength(1);
        expect(result[0].bloodType).toBe('O-');
        expect(result[0].name).toBe('Test Subject 1');
      });

      it('should filter blood sacks by recruitment status', () => {
        const result = resolvers.Query.bloodSacks(null, { 
          filter: { recruited: true } 
        });
        
        expect(result).toHaveLength(1);
        expect(result[0].isRecruited).toBe(true);
        expect(result[0].name).toBe('Test Subject 2');
      });

      it('should filter blood sacks by quality', () => {
        const result = resolvers.Query.bloodSacks(null, { 
          filter: { quality: 'Premium' } 
        });
        
        expect(result).toHaveLength(1);
        expect(result[0].quality).toBe('Premium');
        expect(result[0].name).toBe('Test Subject 1');
      });

      it('should filter blood sacks by location', () => {
        const result = resolvers.Query.bloodSacks(null, { 
          filter: { location: 'Downtown' } 
        });
        
        expect(result).toHaveLength(1);
        expect(result[0].location).toBe('Downtown');
        expect(result[0].name).toBe('Test Subject 1');
      });

      it('should return empty array when no matches found', () => {
        const result = resolvers.Query.bloodSacks(null, { 
          filter: { bloodType: 'AB-' } 
        });
        
        expect(result).toHaveLength(0);
      });
    });

    describe('bloodSack', () => {
      it('should return specific blood sack by ID', () => {
        const result = resolvers.Query.bloodSack(null, { id: '1' });
        
        expect(result).toBeDefined();
        expect(result.id).toBe('1');
        expect(result.name).toBe('Test Subject 1');
      });

      it('should return undefined for non-existent ID', () => {
        const result = resolvers.Query.bloodSack(null, { id: '999' });
        
        expect(result).toBeUndefined();
      });
    });
  });

  describe('Mutation Resolvers', () => {
    describe('addBloodSack', () => {
      const validInput = {
        name: 'New Test Subject',
        bloodType: 'B+',
        age: 28,
        location: 'Business District',
        quality: 'Good',
        notes: 'New recruitment target'
      };

      it('should successfully add a new blood sack with valid input', () => {
        const result = resolvers.Mutation.addBloodSack(null, { input: validInput });
        
        expect(result).toBeDefined();
        expect(result.name).toBe(validInput.name);
        expect(result.bloodType).toBe(validInput.bloodType);
        expect(result.age).toBe(validInput.age);
        expect(result.location).toBe(validInput.location);
        expect(result.quality).toBe(validInput.quality);
        expect(result.notes).toBe(validInput.notes);
        expect(result.isRecruited).toBe(false);
        expect(result.pricePerPint).toBeGreaterThan(0);
        expect(result.id).toBeDefined();
        expect(result.lastSeen).toBeDefined();
        
        // Verify it was added to the database
        const allBloodSacks = mockNoSqlDb.get('bloodSacks');
        expect(allBloodSacks).toHaveLength(3);
      });

      it('should set default quality to Average if not provided', () => {
        const inputWithoutQuality: any = { ...validInput };
        delete inputWithoutQuality.quality;
        
        const result = resolvers.Mutation.addBloodSack(null, { input: inputWithoutQuality });
        
        expect(result.quality).toBe('Average');
      });

      it('should throw error for name shorter than 2 characters', () => {
        const invalidInput = { ...validInput, name: 'X' };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Name must be at least 2 characters');
      });

      it('should throw error for invalid blood type', () => {
        const invalidInput = { ...validInput, bloodType: 'Z+' };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Invalid blood type');
      });

      it('should throw error for age out of range', () => {
        const invalidInput = { ...validInput, age: 15 };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Age must be between 18 and 100');
      });

      it('should throw error for age over 100', () => {
        const invalidInput = { ...validInput, age: 101 };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Age must be between 18 and 100');
      });

      it('should throw error for invalid location', () => {
        const invalidInput = { ...validInput, location: 'Invalid Location' };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Invalid location');
      });

      it('should throw error for invalid quality', () => {
        const invalidInput = { ...validInput, quality: 'Invalid Quality' };
        
        expect(() => {
          resolvers.Mutation.addBloodSack(null, { input: invalidInput });
        }).toThrow('Invalid quality');
      });

      it('should validate trimmed name length but preserve original', () => {
        const inputWithWhitespace = { ...validInput, name: '  Test Name  ' };
        
        const result = resolvers.Mutation.addBloodSack(null, { input: inputWithWhitespace });
        
        // The validation checks trimmed length, but the stored value is preserved
        expect(result.name).toBe('  Test Name  ');
        expect(result.name.trim().length).toBeGreaterThan(2);
      });
    });

    describe('recruitBloodSack', () => {
      it('should successfully recruit an available blood sack', () => {
        const result = resolvers.Mutation.recruitBloodSack(null, { id: '1' });
        
        expect(result).toBeDefined();
        expect(result.id).toBe('1');
        expect(result.isRecruited).toBe(true);
        expect(result.pricePerPint).toBe(0);
        expect(result.recruitedDate).toBeDefined();
        
        // Verify the change was persisted
        const allBloodSacks = mockNoSqlDb.get('bloodSacks');
        const recruitedSack = allBloodSacks.find((sack: any) => sack.id === '1');
        expect(recruitedSack.isRecruited).toBe(true);
        expect(recruitedSack.pricePerPint).toBe(0);
      });

      it('should work on already recruited blood sack (idempotent)', () => {
        const result = resolvers.Mutation.recruitBloodSack(null, { id: '2' });
        
        expect(result).toBeDefined();
        expect(result.id).toBe('2');
        expect(result.isRecruited).toBe(true);
        expect(result.pricePerPint).toBe(0);
      });

      it('should throw error for non-existent blood sack', () => {
        expect(() => {
          resolvers.Mutation.recruitBloodSack(null, { id: '999' });
        }).toThrow('Blood sack not found');
      });

      it('should preserve existing data when recruiting', () => {
        const originalSack = mockNoSqlDb.get('bloodSacks').find((sack: any) => sack.id === '1');
        const originalName = originalSack.name;
        const originalBloodType = originalSack.bloodType;
        
        const result = resolvers.Mutation.recruitBloodSack(null, { id: '1' });
        
        expect(result.name).toBe(originalName);
        expect(result.bloodType).toBe(originalBloodType);
        expect(result.age).toBe(originalSack.age);
        expect(result.location).toBe(originalSack.location);
        expect(result.quality).toBe(originalSack.quality);
        expect(result.notes).toBe(originalSack.notes);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty blood sacks database gracefully', () => {
      mockNoSqlDb.set('bloodSacks', []);
      
      const result = resolvers.Query.bloodSacks(null, {});
      expect(result).toHaveLength(0);
    });

    it('should handle missing blood sacks database gracefully', () => {
      mockNoSqlDb.delete('bloodSacks');
      
      const result = resolvers.Query.bloodSacks(null, {});
      expect(result).toHaveLength(0);
    });

    it('should handle complex filter combinations', () => {
      const result = resolvers.Query.bloodSacks(null, { 
        filter: { 
          bloodType: 'O-',
          recruited: false,
          quality: 'Premium',
          location: 'Downtown'
        } 
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Subject 1');
    });

    it('should return empty array when complex filter has no matches', () => {
      const result = resolvers.Query.bloodSacks(null, { 
        filter: { 
          bloodType: 'O-',
          recruited: true,  // Contradicts the available O- subject
          quality: 'Premium',
          location: 'Downtown'
        } 
      });
      
      expect(result).toHaveLength(0);
    });
  });
});
