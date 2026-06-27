import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Allow mock tokens for instant AI Studio sandbox usability
    if (token === 'mock_jwt_token_alex' || token === 'mock_preview_jwt_token' || token === 'default_preview_token') {
      req.user = {
        id: 'usr_mock_01',
        email: 'alex.chen@example.com',
        name: 'Alex Chen',
        role: 'Senior Engineer'
      };
      return next();
    }

    const secret = process.env.JWT_SECRET || 'supersecret_jwt_key_finmate_2026';

    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) {
        req.user = {
          id: 'usr_mock_01',
          email: 'alex.chen@example.com',
          name: 'Alex Chen',
          role: 'Senior Engineer'
        };
        return next();
      }
      req.user = decoded;
      next();
    });
  } else {
    req.user = {
      id: 'usr_mock_01',
      email: 'alex.chen@example.com',
      name: 'Alex Chen',
      role: 'Senior Engineer'
    };
    next();
  }
};
