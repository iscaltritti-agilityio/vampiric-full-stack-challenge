import express from 'express';
import { sqlDb, noSqlDb } from '../database/init';
import { requireVampireAuth, AuthenticatedRequest } from '../middleware/auth';

export const apiRoutes = express.Router();

// Public endpoint to get vampire authentication token (demo purposes only)
apiRoutes.post('/vampire/authenticate', (req, res) => {
  const { secretPhrase } = req.body;
  
  if (secretPhrase === 'eternal darkness calls') {
    res.json({ 
      token: 'VAMPIRE_ETERNAL_ACCESS_TOKEN_1347',
      message: 'Welcome to the coven, eternal one.',
      expiresIn: 'Never (you are immortal)'
    });
  } else {
    res.status(401).json({ 
      error: 'Incorrect secret phrase. Only true vampires know the ancient words.',
      hint: 'Whisper the words that call the eternal darkness...'
    });
  }
});

// Vampire Profile endpoints (REST + SQL) - Protected routes
apiRoutes.get('/vampire/profile', requireVampireAuth, (req: AuthenticatedRequest, res) => {
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

apiRoutes.put('/vampire/profile', requireVampireAuth, (req: AuthenticatedRequest, res) => {
  const { name, email, age, clan, preferred_blood_type, hunting_territory } = req.body;
  
  // Validate inputs
  if (!name || !email || age === undefined || !clan || !preferred_blood_type || !hunting_territory) {
    return res.status(400).json({ error: 'All profile fields are required' });
  }

  const numericAge = Number(age);
  if (!Number.isFinite(numericAge) || numericAge < 18 || numericAge > 5000) {
    return res.status(400).json({ error: 'Age must be between 18 and 5000' });
  }

  const allowedBloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const allowedClans = ['Drăculești', 'Bathory', 'Karnstein', 'LeStat', 'Nosferatu'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!allowedClans.includes(clan)) {
    return res.status(400).json({ error: 'Invalid clan' });
  }
  if (!allowedBloodTypes.includes(preferred_blood_type)) {
    return res.status(400).json({ error: 'Invalid preferred blood type' });
  }
  if (typeof hunting_territory !== 'string' || hunting_territory.trim().length === 0) {
    return res.status(400).json({ error: 'Hunting territory is required' });
  }

  sqlDb.run(`
    UPDATE vampire_profiles 
    SET name = ?, email = ?, age = ?, clan = ?, preferred_blood_type = ?, hunting_territory = ?
    WHERE id = 1
  `, [name, email, numericAge, clan, preferred_blood_type, hunting_territory], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Return the updated profile so the UI can refresh immediately
    sqlDb.get('SELECT * FROM vampire_profiles WHERE id = 1', (selectErr, row) => {
      if (selectErr) {
        return res.status(500).json({ error: selectErr.message });
      }
      res.json(row);
    });
  });
});

apiRoutes.post('/vampire/feed', requireVampireAuth, (req: AuthenticatedRequest, res) => {
  const now = new Date().toISOString();
  const { location, notes } = req.body;
  const powerGained = Math.floor(Math.random() * 10) + 5; // 5-14 power points
  
  sqlDb.run(`
    UPDATE vampire_profiles 
    SET last_fed = ?, power_level = CASE 
      WHEN power_level < 90 THEN power_level + ? 
      ELSE 100 
    END
    WHERE id = 1
  `, [now, powerGained], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Add to feeding history
    sqlDb.run(`
      INSERT INTO feeding_history (vampire_id, fed_at, power_gained, location, notes) 
      VALUES (1, ?, ?, ?, ?)
    `, [now, powerGained, location || 'Unknown Location', notes || 'Regular feeding'], function(historyErr) {
      if (historyErr) {
        console.error('Failed to log feeding history:', historyErr);
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
});

// Get feeding history
apiRoutes.get('/vampire/feeding-history', requireVampireAuth, (req: AuthenticatedRequest, res) => {
  sqlDb.all(`
    SELECT * FROM feeding_history 
    WHERE vampire_id = 1 
    ORDER BY fed_at DESC 
    LIMIT 20
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Upload profile picture (base64)
apiRoutes.post('/vampire/profile-picture', requireVampireAuth, (req: AuthenticatedRequest, res) => {
  const { profilePicture } = req.body;
  
  if (!profilePicture || typeof profilePicture !== 'string') {
    return res.status(400).json({ error: 'Profile picture data is required' });
  }
  
  // Validate base64 image format
  if (!profilePicture.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image format. Must be a base64 encoded image.' });
  }
  
  // Check image size (limit to ~2MB base64)
  if (profilePicture.length > 2.8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large. Maximum size is 2MB.' });
  }
  
  sqlDb.run(`
    UPDATE vampire_profiles 
    SET profile_picture = ?
    WHERE id = 1
  `, [profilePicture], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Return updated profile
    sqlDb.get('SELECT * FROM vampire_profiles WHERE id = 1', (selectErr, row) => {
      if (selectErr) {
        return res.status(500).json({ error: selectErr.message });
      }
      res.json(row);
    });
  });
});
