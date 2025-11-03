import { noSqlDb } from '../database/init';

export const typeDefs = `
  type BloodSack {
    id: ID!
    name: String!
    bloodType: String!
    age: Int!
    location: String!
    isRecruited: Boolean!
    recruitedDate: String
    pricePerPint: Float!
    quality: String!
    lastSeen: String!
    notes: String
  }

  input BloodSackFilter {
    bloodType: String
    recruited: Boolean
    quality: String
    location: String
  }

  input BloodSackInput {
    name: String!
    bloodType: String!
    age: Int!
    location: String!
    quality: String
    notes: String
  }

  type Query {
    bloodSacks(filter: BloodSackFilter): [BloodSack!]!
    bloodSack(id: ID!): BloodSack
  }

  type Mutation {
    addBloodSack(input: BloodSackInput!): BloodSack!
    recruitBloodSack(id: ID!): BloodSack!
  }
`;

export const resolvers = {
  Query: {
    bloodSacks: (_: any, { filter }: { filter?: any }) => {
      let bloodSacks = noSqlDb.get('bloodSacks') || [];
      
      if (filter) {
        if (filter.bloodType) {
          bloodSacks = bloodSacks.filter((sack: any) => sack.bloodType === filter.bloodType);
        }
        if (filter.recruited !== undefined) {
          bloodSacks = bloodSacks.filter((sack: any) => sack.isRecruited === filter.recruited);
        }
        if (filter.quality) {
          bloodSacks = bloodSacks.filter((sack: any) => sack.quality === filter.quality);
        }
        if (filter.location) {
          bloodSacks = bloodSacks.filter((sack: any) => sack.location === filter.location);
        }
      }
      
      return bloodSacks;
    },

    bloodSack: (_: any, { id }: { id: string }) => {
      const bloodSacks = noSqlDb.get('bloodSacks') || [];
      return bloodSacks.find((sack: any) => sack.id === id);
    },
  },

  Mutation: {
    addBloodSack: (_: any, { input }: { input: any }) => {
      const bloodSacks = noSqlDb.get('bloodSacks') || [];
      const newSack = {
        id: Date.now().toString(),
        name: input.name,
        bloodType: input.bloodType,
        age: input.age,
        location: input.location,
        isRecruited: false,
        pricePerPint: calculatePrice(input.bloodType, input.quality || 'Average'),
        quality: input.quality || 'Average',
        lastSeen: new Date().toISOString(),
        notes: input.notes || ''
      };

      bloodSacks.push(newSack);
      noSqlDb.set('bloodSacks', bloodSacks);
      
      return newSack;
    },

    recruitBloodSack: (_: any, { id }: { id: string }) => {
      const bloodSacks = noSqlDb.get('bloodSacks') || [];
      const sackIndex = bloodSacks.findIndex((sack: any) => sack.id === id);
      
      if (sackIndex === -1) {
        throw new Error('Blood sack not found');
      }

      // B-3
      // Yeah well, no wonder this doesn't work, someone forgot to uncomment this!
      // bloodSacks[sackIndex].isRecruited = true;
      // bloodSacks[sackIndex].recruitedDate = new Date().toISOString();
      // bloodSacks[sackIndex].pricePerPint = 0;

      noSqlDb.set('bloodSacks', bloodSacks);
      
      return bloodSacks[sackIndex];
    },
  },
};

// Helper function to calculate blood price based on type and quality
function calculatePrice(bloodType: string, quality: string): number {
  const basePrice = {
    'O-': 200,
    'AB-': 180,
    'A-': 150,
    'B-': 150,
    'O+': 120,
    'AB+': 100,
    'A+': 100,
    'B+': 80
  }[bloodType] || 100;

  const qualityMultiplier = {
    'Premium': 1.5,
    'Good': 1.2,
    'Average': 1.0,
    'Poor': 0.7
  }[quality] || 1.0;

  return Math.round(basePrice * qualityMultiplier);
}
