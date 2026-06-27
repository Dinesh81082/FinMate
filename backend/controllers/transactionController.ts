import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.ts';
import { TransactionService } from '../services/transactionService.ts';

/**
 * GET /api/transactions
 */
export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { search, category, startDate, endDate, page, limit } = req.query;

    const result = await TransactionService.getTransactions({
      user_id,
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });

    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/transactions
 */
export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: errors.array()[0].msg, errors: errors.array() });
      return;
    }

    const user_id = req.user?.id || 'usr_mock_01';
    const { merchant, category, type, amount, date, notes } = req.body;

    const newTx = await TransactionService.createTransaction(user_id, {
      merchant,
      category,
      type,
      amount,
      date,
      notes
    });

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: newTx
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/transactions/:id
 */
export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: errors.array()[0].msg, errors: errors.array() });
      return;
    }

    const user_id = req.user?.id || 'usr_mock_01';
    const { id } = req.params;
    const { merchant, category, type, amount, date, notes } = req.body;

    const updated = await TransactionService.updateTransaction(id, user_id, {
      merchant,
      category,
      type,
      amount,
      date,
      notes
    });

    if (!updated) {
      res.status(404).json({ status: 'error', message: 'Transaction not found or unauthorized' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { id } = req.params;

    const deleted = await TransactionService.deleteTransaction(id, user_id);

    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Transaction not found or unauthorized' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
