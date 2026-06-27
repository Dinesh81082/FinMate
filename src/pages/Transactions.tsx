import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFinance, TransactionRecord } from '../context/FinanceContext.tsx';
import { TransactionModal, TransactionFormData } from '../components/transactions/TransactionModal.tsx';
import { DeleteConfirmModal } from '../components/transactions/DeleteConfirmModal.tsx';
import { TransactionFilters } from '../components/transactions/TransactionFilters.tsx';

const ALL_CATEGORIES = [
  'Business',
  'Groceries',
  'Dining',
  'Housing',
  'Utilities',
  'Income',
  'Salary',
  'Investments',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Travel',
  'Other'
];

export const Transactions: React.FC = () => {
  const {
    transactions,
    pagination,
    isLoadingTransactions,
    transactionsError,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  } = useFinance();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'Income' | 'Expense'>('Expense');
  
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionRecord | null>(null);
  const [isDeletingOperation, setIsDeletingOperation] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page: currentPage,
        limit: pageSize
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, startDateFilter, endDateFilter, currentPage, fetchTransactions]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
  };

  const handleOpenAdd = (type: 'Income' | 'Expense') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = async (formData: TransactionFormData) => {
    setBannerNotice(null);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          merchant: formData.merchant,
          category: formData.category,
          type: formData.type,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes
        });
        setBannerNotice({ type: 'success', message: `Transaction "${formData.merchant}" updated.` });
        setEditingTransaction(null);
      } else {
        await createTransaction({
          merchant: formData.merchant,
          category: formData.category,
          type: formData.type,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes
        });
        setBannerNotice({ type: 'success', message: `Added new ${formData.type.toLowerCase()} record.` });
      }
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Action failed.' });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeletingOperation(true);
    setBannerNotice(null);
    try {
      await deleteTransaction(deletingTransaction.id);
      setBannerNotice({ type: 'success', message: `Record deleted permanently.` });
      setDeletingTransaction(null);
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Failed to delete.' });
    } finally {
      setIsDeletingOperation(false);
    }
  };

  return (
    <div className="p-6 flex-1 flex flex-col overflow-hidden select-none bg-slate-50 gap-4">
      {/* Header Bar with Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Ledger & Transactions</h2>
          <p className="text-xs text-slate-500">Manage income records, merchant expenditures, and tax categories</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAdd('Expense')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
          >
            <span className="text-base font-mono leading-none">-</span>
            <span>Add Expense</span>
          </button>
          
          <button
            onClick={() => handleOpenAdd('Income')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
          >
            <span className="text-base font-mono leading-none">+</span>
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {bannerNotice && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shrink-0 animate-in fade-in ${
          bannerNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{bannerNotice.message}</span>
          <button onClick={() => setBannerNotice(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {transactionsError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2 shrink-0">
          <span>⚠️ {transactionsError} Displaying local memory snapshot.</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <TransactionFilters
        search={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        category={selectedCategory}
        onCategoryChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
        startDate={startDateFilter}
        onStartDateChange={(val) => { setStartDateFilter(val); setCurrentPage(1); }}
        endDate={endDateFilter}
        onEndDateChange={(val) => { setEndDateFilter(val); setCurrentPage(1); }}
        onReset={handleResetFilters}
        categories={ALL_CATEGORIES}
      />

      {/* Main Ledger Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col flex-1 overflow-hidden">
        {/* Table Header Summary */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider">Filtered Ledger View</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-300">
            Showing {transactions.length} of {pagination.total} records
          </span>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingTransactions ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
              <span className="text-xs font-semibold">Synchronizing transactions ledger...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-1">
                📭
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                No ledger records match your search or date criteria. Try resetting filters or recording a new expense.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-left text-[11px]">
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Date</th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Merchant / Details</th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Category</th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">Amount</th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {tx.date}
                    </td>
                    
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{tx.merchant}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">{tx.notes}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-tight">
                        {tx.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-sm">
                      <span className={tx.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.type === 'Income' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Edit Transaction"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => setDeletingTransaction(tx)}
                          className="p-1.5 hover:bg-rose-100 rounded text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-500 font-medium">
            Page <span className="font-bold text-slate-800">{pagination.page}</span> of <span className="font-bold text-slate-800">{pagination.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoadingTransactions}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              ← Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages || isLoadingTransactions}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSaveTransaction}
        defaultType={addModalType}
      />

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        merchantName={deletingTransaction?.merchant}
        isDeleting={isDeletingOperation}
      />
    </div>
  );
};
