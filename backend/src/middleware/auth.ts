import { Request, Response, NextFunction } from 'express';

// Simple token-based authentication for demo purposes
// In production, use proper JWT with secure secret management
const VAMPIRE_TOKEN = 'VAMPIRE_ETERNAL_ACCESS_TOKEN_1347';

export interface AuthenticatedRequest extends Request {
  vampireId?: number;
}

export function requireVampireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers?.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. Vampire authentication required.',
      hint: 'Include Authorization: Bearer VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
    });
  }
  
  if (token !== VAMPIRE_TOKEN) {
    return res.status(403).json({ 
      error: 'Invalid vampire credentials. Access forbidden.',
      hint: 'Only eternal beings with proper tokens may access these ancient records.'
    });
  }
  
  // Set vampire ID for authenticated requests
  req.vampireId = 1; // For this demo, always vampire ID 1
  next();
}

// Middleware for optional auth (allows guest access with limited features)
export function optionalVampireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers?.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (token === VAMPIRE_TOKEN) {
    req.vampireId = 1;
  }
  // Continue regardless of auth status
  next();
}
