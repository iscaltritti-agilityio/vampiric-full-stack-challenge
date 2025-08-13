import { Request, Response, NextFunction } from 'express';
import { requireVampireAuth, optionalVampireAuth, AuthenticatedRequest } from '../middleware/auth';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireVampireAuth', () => {
    it('should authenticate with valid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.vampireId).toBe(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. Vampire authentication required.',
        hint: 'Include Authorization: Bearer VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.vampireId).toBeUndefined();
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. Vampire authentication required.',
        hint: 'Include Authorization: Bearer VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer INVALID_TOKEN'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid vampire credentials. Access forbidden.',
        hint: 'Only eternal beings with proper tokens may access these ancient records.'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.vampireId).toBeUndefined();
    });

    it('should handle empty Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authorization header without Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should be case sensitive for token', () => {
      mockRequest.headers = {
        authorization: 'Bearer vampire_eternal_access_token_1347'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalVampireAuth', () => {
    it('should set vampireId with valid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      };

      optionalVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.vampireId).toBe(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', () => {
      optionalVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.vampireId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', () => {
      mockRequest.headers = {
        authorization: 'Bearer INVALID_TOKEN'
      };

      optionalVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.vampireId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header gracefully', () => {
      mockRequest.headers = {
        authorization: 'MalformedHeader'
      };

      optionalVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.vampireId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined headers gracefully', () => {
      mockRequest.headers = undefined;

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null authorization header', () => {
      mockRequest.headers = {
        authorization: null as any
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authorization header with multiple spaces', () => {
      mockRequest.headers = {
        authorization: 'Bearer    VAMPIRE_ETERNAL_ACCESS_TOKEN_1347'
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // This should fail because split(' ')[1] would be empty string
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle very long invalid tokens', () => {
      const longInvalidToken = 'A'.repeat(1000);
      mockRequest.headers = {
        authorization: `Bearer ${longInvalidToken}`
      };

      requireVampireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
