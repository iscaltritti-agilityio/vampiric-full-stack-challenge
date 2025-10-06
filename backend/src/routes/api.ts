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
  if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 18 || ageNum > 5000) {
    return res.status(400).json({ error: 'Age must be a valid number between 18 and 5000' });
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
    
    // BUG B-2: Vampire profile updates aren't reflected properly
    res.json({ success: true, message: 'Profile updated successfully' });
  });
});

apiRoutes.post('/vampire/feed', (req, res) => {
  const now = new Date().toISOString();
  
  sqlDb.run(`
    UPDATE vampire_profiles 
    SET last_fed = ?, power_level = CASE 
      WHEN power_level < 90 THEN power_level + 10 
      ELSE 100 
    END
    WHERE id = 1
  `, [now], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Return updated profile
    sqlDb.get('SELECT * FROM vampire_profiles WHERE id = 1', (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });
});
