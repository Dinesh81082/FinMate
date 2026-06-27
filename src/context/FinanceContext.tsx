import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';

export interface TransactionRecord {
  id: string;
  user_id?: string;
  merchant: string;
  category: string;
  type: 'Income' | 'Expense';
  amount: number; // Positive absolute value
  date: string;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Investment';
  balance: number;
  number: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FinanceContextType {
  transactions: TransactionRecord[];
  pagination: PaginationMeta;
  isLoadingTransactions: boolean;
  transactionsError: string | null;
  accounts: Account[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsGoalProgress: number;
  fetchTransactions: (params?: {
    search?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createTransaction: (data: Omit<TransactionRecord, 'id' | 'user_id'>) => Promise<TransactionRecord>;
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => Promise<TransactionRecord>;
  deleteTransaction: (id: string) => Promise<void>;
}

const initialAccounts: Account[] = [
  { id: 'acc_1', name: 'Chase Premium Checking', type: 'Checking', balance: 14250.00, number: '**** 4912' },
  { id: 'acc_2', name: 'High Yield Savings', type: 'Savings', balance: 28310.12, number: '**** 8821' }
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [accounts] = useState<Account[]>(initialAccounts);

  // Metrics state calculated dynamically
  const [monthlyIncome, setMonthlyIncome] = useState(8400.00);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3120.45);
  const [totalBalance, setTotalBalance] = useState(42560.12);

  const fetchTransactions = useCallback(async (params?: {
    search?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);

    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/transactions?${queryParams.toString()}`, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      if (json.status === 'success') {
        setTransactions(json.data || []);
        setPagination(json.pagination || { total: json.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
        
        // Dynamically recalculate totals based on full or fetched set
        let inc = 0;
        let exp = 0;
        (json.data || []).forEach((tx: TransactionRecord) => {
          if (tx.type === 'Income') inc += Number(tx.amount);
          else exp += Number(tx.amount);
        });
        if (json.data && json.data.length > 0) {
          setMonthlyIncome(prev => Math.max(prev, inc));
          setMonthlyExpenses(prev => Math.max(prev, exp));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setTransactionsError('Failed to load transaction records from server.');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchTransactions({ page: 1, limit: 10 });
  }, [fetchTransactions]);

  const createTransaction = async (data: Omit<TransactionRecord, 'id' | 'user_id'>): Promise<TransactionRecord> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to create transaction');
    }

    const json = await res.json();
    const created = json.data as TransactionRecord;

    // Update local state metrics
    if (created.type === 'Income') {
      setMonthlyIncome(prev => prev + Number(created.amount));
      setTotalBalance(prev => prev + Number(created.amount));
    } else {
      setMonthlyExpenses(prev => prev + Number(created.amount));
      setTotalBalance(prev => prev - Number(created.amount));
    }

    // Refresh list
    await fetchTransactions({ page: pagination.page, limit: pagination.limit });
    return created;
  };

  const updateTransaction = async (id: string, data: Partial<TransactionRecord>): Promise<TransactionRecord> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to update transaction');
    }

    const json = await res.json();
    await fetchTransactions({ page: pagination.page, limit: pagination.limit });
    return json.data;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const target = transactions.find(t => t.id === id);

    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to delete transaction');
    }

    if (target) {
      if (target.type === 'Income') {
        setMonthlyIncome(prev => Math.max(0, prev - Number(target.amount)));
        setTotalBalance(prev => prev - Number(target.amount));
      } else {
        setMonthlyExpenses(prev => Math.max(0, prev - Number(target.amount)));
        setTotalBalance(prev => prev + Number(target.amount));
      }
    }

    await fetchTransactions({ page: pagination.page, limit: pagination.limit });
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        pagination,
        isLoadingTransactions,
        transactionsError,
        accounts,
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsGoalProgress: 82,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
