// @ts-nocheck
// Test utility functions and edge cases
describe('Utility Functions', () => {
  // Import the calculatePrice function from schema.ts
  // We need to extract it or test it indirectly through addBloodSack
  
  // Mock the database
  jest.mock('../database/init', () => ({
    noSqlDb: new Map()
  }));

  describe('Price Calculation', () => {
    let mockNoSqlDb: Map<string, any>;

    beforeEach(() => {
      // Get the mocked database reference
      const { noSqlDb } = require('../database/init');
      mockNoSqlDb = noSqlDb;
      
      mockNoSqlDb.clear();
      mockNoSqlDb.set('bloodSacks', []);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // Test price calculation indirectly through addBloodSack mutation
    it('should calculate correct price for O- Premium blood', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O-',
        age: 25,
        location: 'Downtown',
        quality: 'Premium',
        notes: 'Test'
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      
      // O- base price: 200, Premium multiplier: 1.5 = 300
      expect(result.pricePerPint).toBe(300);
    });

    it('should calculate correct price for B+ Poor blood', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'B+',
        age: 25,
        location: 'Downtown',
        quality: 'Poor',
        notes: 'Test'
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      
      // B+ base price: 80, Poor multiplier: 0.7 = 56
      expect(result.pricePerPint).toBe(56);
    });

    it('should use Average quality as default', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'A+',
        age: 25,
        location: 'Downtown',
        notes: 'Test'
        // No quality specified
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      
      // A+ base price: 100, Average multiplier: 1.0 = 100
      expect(result.pricePerPint).toBe(100);
      expect(result.quality).toBe('Average');
    });

    it('should handle unknown blood type with fallback price', async () => {
      const { resolvers } = require('../graphql/schema');
      
      // This should fail validation before reaching price calculation
      const input = {
        name: 'Test Subject',
        bloodType: 'UNKNOWN',
        age: 25,
        location: 'Downtown',
        quality: 'Average',
        notes: 'Test'
      };

      expect(() => {
        resolvers.Mutation.addBloodSack(null, { input });
      }).toThrow('Invalid blood type');
    });

    it('should calculate prices for all blood types', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const bloodTypes = ['O-', 'AB-', 'A-', 'B-', 'O+', 'AB+', 'A+', 'B+'];
      const expectedPrices = [200, 180, 150, 150, 120, 100, 100, 80];

      bloodTypes.forEach((bloodType, index) => {
        const input = {
          name: `Test Subject ${index}`,
          bloodType,
          age: 25,
          location: 'Downtown',
          quality: 'Average',
          notes: 'Test'
        };

        const result = resolvers.Mutation.addBloodSack(null, { input });
        expect(result.pricePerPint).toBe(expectedPrices[index]);
      });
    });

    it('should calculate prices for all quality levels', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const qualities = ['Premium', 'Good', 'Average', 'Poor'];
      const multipliers = [1.5, 1.2, 1.0, 0.7];
      const basePrice = 100; // A+ blood type

      qualities.forEach((quality, index) => {
        const input = {
          name: `Test Subject ${index}`,
          bloodType: 'A+',
          age: 25,
          location: 'Downtown',
          quality,
          notes: 'Test'
        };

        const result = resolvers.Mutation.addBloodSack(null, { input });
        const expectedPrice = Math.round(basePrice * multipliers[index]);
        expect(result.pricePerPint).toBe(expectedPrice);
      });
    });
  });

  describe('Data Validation Edge Cases', () => {
    let mockNoSqlDb: Map<string, any>;

    beforeEach(() => {
      // Get the mocked database reference
      const { noSqlDb } = require('../database/init');
      mockNoSqlDb = noSqlDb;
      
      mockNoSqlDb.clear();
      mockNoSqlDb.set('bloodSacks', []);
    });

    it('should handle numeric age as string', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: '25', // String instead of number
        location: 'Downtown',
        quality: 'Average',
        notes: 'Test'
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      expect(Number(result.age)).toBe(25);
    });

    it('should reject non-numeric age strings', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: 'twenty-five',
        location: 'Downtown',
        quality: 'Average',
        notes: 'Test'
      };

      expect(() => {
        resolvers.Mutation.addBloodSack(null, { input });
      }).toThrow('Age must be between 18 and 100');
    });

    it('should handle empty notes gracefully', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: 25,
        location: 'Downtown',
        quality: 'Average',
        notes: ''
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      expect(result.notes).toBe('');
    });

    it('should handle missing notes field', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: 25,
        location: 'Downtown',
        quality: 'Average'
        // notes field missing
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      expect(result.notes).toBe('');
    });

    it('should generate unique IDs for multiple additions', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: 25,
        location: 'Downtown',
        quality: 'Average',
        notes: 'Test'
      };

      const result1 = resolvers.Mutation.addBloodSack(null, { input });
      
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      
      const result2 = resolvers.Mutation.addBloodSack(null, { input });

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
      
      // Verify both were actually added to the database
      const bloodSacks = mockNoSqlDb.get('bloodSacks');
      expect(bloodSacks.length).toBeGreaterThanOrEqual(2);
    });

    it('should set lastSeen to current timestamp', async () => {
      const { resolvers } = require('../graphql/schema');
      
      const beforeTime = new Date().getTime();
      
      const input = {
        name: 'Test Subject',
        bloodType: 'O+',
        age: 25,
        location: 'Downtown',
        quality: 'Average',
        notes: 'Test'
      };

      const result = resolvers.Mutation.addBloodSack(null, { input });
      
      const afterTime = new Date().getTime();
      const resultTime = new Date(result.lastSeen).getTime();
      
      expect(resultTime).toBeGreaterThanOrEqual(beforeTime);
      expect(resultTime).toBeLessThanOrEqual(afterTime);
    });
  });
});
