/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { FinanceProvider } from './context/FinanceContext.tsx';
import { Layout } from './components/common/Layout.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { ErrorPage } from './pages/ErrorPage.tsx';
import { Login } from './pages/Login.tsx';
import { Signup } from './pages/Signup.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Transactions } from './pages/Transactions.tsx';
import { Accounts } from './pages/Accounts.tsx';
import { Analytics } from './pages/Analytics.tsx';
import { Budgets } from './pages/Budgets.tsx';
import { Reports } from './pages/Reports.tsx';
import { AiAssistant } from './pages/AiAssistant.tsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/signup',
    element: <Signup />,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'accounts', element: <Accounts /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'budgets', element: <Budgets /> },
          { path: 'reports', element: <Reports /> },
          { path: 'ai', element: <AiAssistant /> }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <ErrorPage />
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <RouterProvider router={router} />
      </FinanceProvider>
    </AuthProvider>
  );
}

