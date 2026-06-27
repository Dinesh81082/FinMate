import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { findUserByEmail, createUser, findUserById, UserRecord } from '../models/userModel.ts';
import { AuthRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_finmate_2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Helper to generate signed JWT Token
 */
function generateToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors from express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: errors.array()[0].msg, errors: errors.array() });
      return;
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ status: 'error', message: 'An account with this email address already exists.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRecord: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'Financial Member'
    };

    const created = await createUser(newUserRecord);

    const userPayload = {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role
    };

    const token = generateToken(userPayload);

    res.status(201).json({
      status: 'success',
      message: 'Account registered successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: errors.array()[0].msg, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    // Verify password
    let isMatch = false;
    // Handle plain-text fallback for mock user if bcrypt fails on hardcoded mock string
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    // Allow mock password shortcut 'password123' for preview test account
    if (!isMatch && email.toLowerCase().trim() === 'alex.chen@example.com' && password === 'password123') {
      isMatch = true;
    }

    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(userPayload);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me (Protected)
 */
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout (Protected)
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};
