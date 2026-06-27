import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import {
  fetchUserBudgets,
  createOrUpdateBudgetRecord,
  updateBudgetRecord,
  deleteBudgetRecord
} from '../models/budgetModel.ts';

/**
 * GET /api/budgets
 */
export const getBudgets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const result = await fetchUserBudgets(user_id);

    res.status(200).json({
      status: 'success',
      data: result.budgets,
      summary: result.summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/budgets
 */
export const createBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { category, amount } = req.body;

    if (!category || typeof category !== 'string') {
      res.status(400).json({ status: 'error', message: 'Category is required.' });
      return;
    }
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      res.status(400).json({ status: 'error', message: 'Amount must be a positive number.' });
      return;
    }

    const id = `bdg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created = await createOrUpdateBudgetRecord({
      id,
      user_id,
      category: category.trim(),
      amount: Math.round(numAmt * 100) / 100
    });

    res.status(201).json({
      status: 'success',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/budgets/:id
 */
export const updateBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { id } = req.params;
    const { amount, category } = req.body;

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      res.status(400).json({ status: 'error', message: 'Amount must be a positive number.' });
      return;
    }

    const updated = await updateBudgetRecord(id, user_id, Math.round(numAmt * 100) / 100, category);

    res.status(200).json({
      status: 'success',
      data: updated
    });
  } catch (error: any) {
    if (error.message === 'Budget record not found') {
      res.status(404).json({ status: 'error', message: 'Budget record not found' });
      return;
    }
    next(error);
  }
};

/**
 * DELETE /api/budgets/:id
 */
export const deleteBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { id } = req.params;

    const success = await deleteBudgetRecord(id, user_id);
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Budget record not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Budget record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
