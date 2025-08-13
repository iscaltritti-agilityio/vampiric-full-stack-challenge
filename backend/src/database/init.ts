import sqlite3 from 'sqlite3';
import path from 'path';

// Simulated SQL database using SQLite
export let sqlDb: sqlite3.Database;

// Simulated NoSQL database using in-memory store
export let noSqlDb: Map<string, any> = new Map();

export function initDatabase() {
  // Initialize SQLite database
  const dbPath = path.join(__dirname, '../../data/app.db');
  sqlDb = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
    } else {
      console.log('📦 SQLite database connected');
      createTables();
    }
  });

  // Initialize NoSQL collections
  initNoSqlCollections();
}

function createTables() {
  sqlDb.serialize(() => {
    // Vampire profiles table
    sqlDb.run(`
      CREATE TABLE vampire_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER NOT NULL,
        clan TEXT NOT NULL,
        preferred_blood_type TEXT NOT NULL,
        hunting_territory TEXT NOT NULL,
        last_fed DATETIME DEFAULT CURRENT_TIMESTAMP,
        power_level INTEGER DEFAULT 50,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data
    insertSampleData();
  });
}

function insertSampleData() {
  // Sample vampire profile
  const vampireProfile = {
    name: 'Lord Darkwood',
    email: 'darkwood@eternal.coven',
    age: 847,
    clan: 'Drăculești',
    preferred_blood_type: 'O-',
    hunting_territory: 'Downtown District',
    last_fed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    power_level: 85
  };

  sqlDb.run(`
    INSERT INTO vampire_profiles (name, email, age, clan, preferred_blood_type, hunting_territory, last_fed, power_level) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    vampireProfile.name,
    vampireProfile.email,
    vampireProfile.age,
    vampireProfile.clan,
    vampireProfile.preferred_blood_type,
    vampireProfile.hunting_territory,
    vampireProfile.last_fed,
    vampireProfile.power_level
  ]);
}

function initNoSqlCollections() {
  // Blood sacks registry
  const bloodSacks = [
    {
      id: '1',
      name: 'Margaret Thompson',
      bloodType: 'O-',
      age: 28,
      location: 'Downtown',
      isRecruited: false,
      pricePerPint: 150.00,
      quality: 'Premium',
      lastSeen: new Date('2024-01-10').toISOString(),
      notes: 'Regular donor at blood bank, excellent health'
    },
    {
      id: '2',
      name: 'James Wilson',
      bloodType: 'A+',
      age: 35,
      location: 'University District',
      isRecruited: true,
      recruitedDate: new Date('2023-12-15').toISOString(),
      pricePerPint: 0,
      quality: 'Good',
      lastSeen: new Date('2024-01-08').toISOString(),
      notes: 'Turned successfully, now part of our coven'
    },
    {
      id: '3',
      name: 'Sarah Chen',
      bloodType: 'AB-',
      age: 24,
      location: 'Business District',
      isRecruited: false,
      pricePerPint: 200.00,
      quality: 'Premium',
      lastSeen: new Date('2024-01-12').toISOString(),
      notes: 'Rare blood type, works night shifts - perfect target'
    },
    {
      id: '4',
      name: 'David Martinez',
      bloodType: 'B+',
      age: 42,
      location: 'Suburbs',
      isRecruited: false,
      pricePerPint: 80.00,
      quality: 'Average',
      lastSeen: new Date('2024-01-05').toISOString(),
      notes: 'Heavy drinker, blood quality compromised'
    }
  ];

  // Store in NoSQL database
  noSqlDb.set('bloodSacks', bloodSacks);

  console.log('🩸 Blood sacks database initialized');
}
