
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { LoginPage } from './components/LoginPage';
import { getCurrentUser, logout, User } from './services/authService';

export type Page = 'dashboard' | 'customers' | 'transactions' | 'analyzer' | 'customer_detail';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsAuthChecked(true);
  }, []);

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setActiveCustomerId(null);
  };

  const navigateTo = (page: Page) => {
    setActiveCustomerId(null);
    setCurrentPage(page);
  };
  
  const viewCustomer = (customerId: string) => {
    setActiveCustomerId(customerId);
    setCurrentPage('customer_detail');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage viewCustomer={viewCustomer} />;
      case 'customers':
        return <CustomersPage viewCustomer={viewCustomer} />;
      case 'customer_detail':
        return activeCustomerId ? <CustomerDetailPage customerId={activeCustomerId} /> : <CustomersPage viewCustomer={viewCustomer} />;
      case 'transactions':
        return <TransactionsPage viewCustomer={viewCustomer} />;
      case 'analyzer':
        return <AnalyzerPage navigateTo={navigateTo} />;
      default:
        return <DashboardPage viewCustomer={viewCustomer} />;
    }
  };

  if (!isAuthChecked) {
    return <div className="min-h-screen bg-slate-900" />; // Loading state
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
       <Layout 
          navigateTo={navigateTo} 
          currentPage={currentPage} 
          user={currentUser}
          onLogout={handleLogout}
       >
          {renderPage()}
       </Layout>
    </div>
  );
};

export default App;
