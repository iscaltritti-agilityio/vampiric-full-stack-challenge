import express from 'express';
import { sqlDb, noSqlDb } from '../database/init';

export const apiRoutes = express.Router();

// Vampire Profile endpoints (REST + SQL)
apiRoutes.get('/vampire/profile', (req, res) => {
  sqlDb.get('SELECT * FROM vampire_profiles LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Vampire profile not found' });
    }
    res.json(row);
  });
});

apiRoutes.put('/vampire/profile', (req, res) => {
  const { name, email, age, clan, preferred_blood_type, hunting_territory } = req.body;
  
  // Validate required fields
  if (!name || !email || !age || !clan || !preferred_blood_type || !hunting_territory) {
    return res.status(400).json({ error: 'All profile fields are required' });
  }
  
  // Validate age is a number
  const ageNum = Number(age);
  if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
    return res.status(400).json({ error: 'Age must be a valid number' });
  }
  
  if (ageNum < 18) {
    return res.status(400).json({ error: '🧛‍♂️ We apologize, but we cannot welcome underage vampires to our ancient coven. Please come back when you\'ve reached the age of immortality (18)!' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  sqlDb.run(`
    UPDATE vampire_profiles 
    SET name = ?, email = ?, age = ?, clan = ?, preferred_blood_type = ?, hunting_territory = ?
    WHERE id = 1
  `, [name, email, ageNum, clan, preferred_blood_type, hunting_territory], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // B-2
    // Hmm, doesn't frontend expect to receive the updated profile here instead?
    res.json({ success: true, message: 'Profile updated successfully' });
  });
});

apiRoutes.post('/vampire/feed', (req, res) => {
  const now = new Date().toISOString();
  
  sqlDb.get(`
    UPDATE vampire_profiles 
    SET last_fed = ?, power_level = CASE 
      WHEN power_level < 90 THEN power_level + 10 
      ELSE 100 
    END
    WHERE id = 1
    RETURNING *
  `, [now], function(err, row) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(row);
  });
});
