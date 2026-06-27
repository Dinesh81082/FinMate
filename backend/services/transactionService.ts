import {
  queryTransactions,
  createTransactionRecord,
  updateTransactionRecord,
  deleteTransactionRecord,
  TransactionRecord,
  TransactionQueryParams
} from '../models/transactionModel.ts';

export class TransactionService {
  /**
   * Fetch paginated and filtered transactions for a user
   */
  static async getTransactions(params: TransactionQueryParams) {
    return await queryTransactions(params);
  }

  /**
   * Create a new income or expense transaction
   */
  static async createTransaction(user_id: string, data: {
    merchant: string;
    category: string;
    type: 'Income' | 'Expense';
    amount: number;
    date: string;
    notes?: string;
  }): Promise<TransactionRecord> {
    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id,
      merchant: data.merchant.trim(),
      category: data.category.trim(),
      type: data.type,
      amount: Math.abs(Number(data.amount)), // Store absolute amount
      date: data.date,
      notes: data.notes?.trim()
    };

    return await createTransactionRecord(record);
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(id: string, user_id: string, updates: {
    merchant?: string;
    category?: string;
    type?: 'Income' | 'Expense';
    amount?: number;
    date?: string;
    notes?: string;
  }): Promise<TransactionRecord | null> {
    const cleanUpdates: Partial<TransactionRecord> = {};
    if (updates.merchant !== undefined) cleanUpdates.merchant = updates.merchant.trim();
    if (updates.category !== undefined) cleanUpdates.category = updates.category.trim();
    if (updates.type !== undefined) cleanUpdates.type = updates.type;
    if (updates.amount !== undefined) cleanUpdates.amount = Math.abs(Number(updates.amount));
    if (updates.date !== undefined) cleanUpdates.date = updates.date;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes.trim();

    return await updateTransactionRecord(id, user_id, cleanUpdates);
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string, user_id: string): Promise<boolean> {
    return await deleteTransactionRecord(id, user_id);
  }
}
