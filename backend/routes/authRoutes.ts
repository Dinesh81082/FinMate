import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getCurrentUser, logout } from '../controllers/authController.ts';
import { authenticateJWT } from '../middleware/auth.ts';

const router = Router();

// Validation chains
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateJWT as any, getCurrentUser as any);
router.post('/logout', authenticateJWT as any, logout);

export default router;
