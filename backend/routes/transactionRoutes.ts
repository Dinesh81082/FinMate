import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateJWT } from '../middleware/auth.ts';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.ts';

const router = Router();

// Validation rule sets
const transactionValidation = [
  body('merchant').trim().notEmpty().withMessage('Merchant name is required.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('type').isIn(['Income', 'Expense']).withMessage('Transaction type must be Income or Expense.'),
  body('amount').isNumeric().withMessage('Amount must be a valid number.'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format.')
];

// All transaction endpoints are protected
router.use(authenticateJWT as any);

router.get('/', getTransactions as any);
router.post('/', transactionValidation, createTransaction as any);
router.put('/:id', transactionValidation, updateTransaction as any);
router.delete('/:id', deleteTransaction as any);

export default router;
