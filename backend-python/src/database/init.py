import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any

# Database connections
_sql_db: sqlite3.Connection = None
_nosql_db: Dict[str, Any] = {}

def init_database():
    global _sql_db, _nosql_db
    
    # Initialize SQLite database
    _sql_db = sqlite3.connect(':memory:', check_same_thread=False)
    _sql_db.row_factory = sqlite3.Row
    
    print('📦 SQLite database connected')
    _create_tables()
    
    # Initialize NoSQL collections
    _init_nosql_collections()

def _create_tables():
    # Vampire profiles table
    _sql_db.execute('''
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
    ''')
    
    # Insert sample data
    _insert_sample_data()

def _insert_sample_data():
    # Sample vampire profile
    vampire_profile = {
        'name': 'Lord Darkwood',
        'email': 'darkwood@eternal.coven',
        'age': 847,
        'clan': 'Drăculești',
        'preferred_blood_type': 'O-',
        'hunting_territory': 'Downtown District',
        'last_fed': (datetime.now() - timedelta(days=5)).isoformat(),  # 5 days ago
        'power_level': 85
    }
    
    _sql_db.execute('''
        INSERT INTO vampire_profiles (name, email, age, clan, preferred_blood_type, hunting_territory, last_fed, power_level) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', [
        vampire_profile['name'],
        vampire_profile['email'],
        vampire_profile['age'],
        vampire_profile['clan'],
        vampire_profile['preferred_blood_type'],
        vampire_profile['hunting_territory'],
        vampire_profile['last_fed'],
        vampire_profile['power_level']
    ])

def _init_nosql_collections():
    global _nosql_db
    
    # Blood sacks registry
    blood_sacks = [
        {
            'id': '1',
            'name': 'Margaret Thompson',
            'bloodType': 'O-',
            'age': 28,
            'location': 'Downtown',
            'isRecruited': False,
            'pricePerPint': 150.00,
            'quality': 'Premium',
            'lastSeen': datetime(2024, 1, 10).isoformat(),
            'notes': 'Regular donor at blood bank, excellent health'
        },
        {
            'id': '2',
            'name': 'James Wilson',
            'bloodType': 'A+',
            'age': 35,
            'location': 'University District',
            'isRecruited': True,
            'recruitedDate': datetime(2023, 12, 15).isoformat(),
            'pricePerPint': 0,
            'quality': 'Good',
            'lastSeen': datetime(2024, 1, 8).isoformat(),
            'notes': 'Turned successfully, now part of our coven'
        },
        {
            'id': '3',
            'name': 'Sarah Chen',
            'bloodType': 'AB-',
            'age': 24,
            'location': 'Business District',
            'isRecruited': False,
            'pricePerPint': 200.00,
            'quality': 'Premium',
            'lastSeen': datetime(2024, 1, 12).isoformat(),
            'notes': 'Rare blood type, works night shifts - perfect target'
        },
        {
            'id': '4',
            'name': 'David Martinez',
            'bloodType': 'B+',
            'age': 42,
            'location': 'Suburbs',
            'isRecruited': False,
            'pricePerPint': 80.00,
            'quality': 'Average',
            'lastSeen': datetime(2024, 1, 5).isoformat(),
            'notes': 'Heavy drinker, blood quality compromised'
        }
    ]
    
    # Store in NoSQL database
    _nosql_db['bloodSacks'] = blood_sacks
    
    print('🩸 Blood sacks database initialized')

def get_sql_db() -> sqlite3.Connection:
    return _sql_db

def get_nosql_db() -> Dict[str, Any]:
    return _nosql_db
