import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginFormInputs {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const { loginApi } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: 'alex.chen@example.com',
      password: 'password123'
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    try {
      await loginApi(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      setApiError(err.message || 'Invalid login credentials.');
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a] p-6 font-sans select-none overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl border border-slate-100 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            F
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">FinMate</span>
        </div>

        <h2 className="text-base font-bold text-slate-800 text-center mb-1">Account Sign In</h2>
        <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider mb-6 font-semibold">
          Enter credentials to access ledger workspace
        </p>

        {apiError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-600 text-xs font-medium">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {errors.email && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required'
              })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {errors.password && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm hover:bg-indigo-700 uppercase tracking-wider transition-colors cursor-pointer mt-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
              Create New Account
            </Link>
          </p>
        </div>

        <div className="mt-4 p-2.5 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500 text-center">
          💡 <span className="font-semibold">Demo Hint:</span> Default credentials pre-filled for instant AI Studio preview!
        </div>
      </div>
    </div>
  );
};
