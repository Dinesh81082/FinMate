import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export interface TransactionFormData {
  merchant: string;
  category: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  notes?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialData?: (TransactionFormData & { id: string }) | null;
  defaultType?: 'Income' | 'Expense';
}

const CATEGORIES = [
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultType = 'Expense'
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormData>({
    defaultValues: {
      merchant: '',
      category: 'Business',
      type: defaultType,
      amount: '' as any,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (initialData) {
      setValue('merchant', initialData.merchant);
      setValue('category', initialData.category);
      setValue('type', initialData.type);
      setValue('amount', Math.abs(initialData.amount));
      setValue('date', initialData.date);
      setValue('notes', initialData.notes || '');
    } else {
      reset({
        merchant: '',
        category: selectedType === 'Income' ? 'Income' : 'Business',
        type: defaultType,
        amount: '' as any,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [initialData, isOpen, setValue, reset, defaultType]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: TransactionFormData) => {
    await onSubmit({
      ...data,
      amount: Number(data.amount)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${selectedType === 'Income' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <h3 className="text-sm font-bold tracking-tight">
              {initialData ? 'Edit Transaction Record' : `Add ${selectedType} Record`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 text-xs">
          {/* Type Selector Toggle */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setValue('type', 'Expense')}
                className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedType === 'Expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'Income')}
                className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedType === 'Income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Merchant Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Merchant / Source Name
            </label>
            <input
              type="text"
              placeholder={selectedType === 'Income' ? 'e.g. Employer Payout' : 'e.g. Apple Store'}
              {...register('merchant', { required: 'Merchant name is required' })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
            />
            {errors.merchant && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.merchant.message}</p>
            )}
          </div>

          {/* Amount and Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
              />
              {errors.amount && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
              />
              {errors.date && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Optional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add payment method or memo details..."
              {...register('notes')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer uppercase tracking-wider text-[11px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer uppercase tracking-wider text-[11px] disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                selectedType === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : `Confirm ${selectedType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
