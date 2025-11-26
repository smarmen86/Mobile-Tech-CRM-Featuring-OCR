
import React from 'react';
import { Page } from '../App';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { DocumentScanIcon } from './icons/DocumentScanIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { User } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
  navigateTo: (page: Page) => void;
  currentPage: Page;
  user: User | null;
  onLogout: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <li>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`flex items-center p-3 rounded-lg text-slate-300 hover:bg-slate-700 group ${
          isActive ? 'bg-slate-700' : ''
        }`}
      >
        {icon}
        <span className="ms-3">{label}</span>
      </a>
    </li>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, navigateTo, currentPage, user, onLogout }) => {
  const mainPages: Page[] = ['dashboard', 'customers', 'transactions', 'analyzer'];
  const isPageActive = (page: Page) => mainPages.includes(currentPage) ? currentPage === page : false;

  const getBrandName = () => {
    if (user?.domain === 'klugmans.com') return 'Klugman CRM';
    if (user?.domain === 'kmobiletech.com') return 'Mobile Tech CRM';
    return 'Mobile Tech CRM';
  };
    
  return (
    <div className="flex">
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-slate-800/50 border-r border-slate-700 flex flex-col" aria-label="Sidebar">
            <div className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="text-center mb-8 mt-4 px-2">
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 break-words">
                        {getBrandName()}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Automation System</p>
                </div>
                <ul className="space-y-2 font-medium">
                    <NavItem 
                        label="Dashboard"
                        icon={<DashboardIcon className="w-5 h-5 text-slate-400 transition duration-75 group-hover:text-slate-100" />}
                        isActive={isPageActive('dashboard')}
                        onClick={() => navigateTo('dashboard')}
                    />
                    <NavItem 
                        label="Customers"
                        icon={<UsersIcon className="w-5 h-5 text-slate-400 transition duration-75 group-hover:text-slate-100" />}
                        isActive={isPageActive('customers')}
                        onClick={() => navigateTo('customers')}
                    />
                    <NavItem 
                        label="Transactions"
                        icon={<CreditCardIcon className="w-5 h-5 text-slate-400 transition duration-75 group-hover:text-slate-100" />}
                        isActive={isPageActive('transactions')}
                        onClick={() => navigateTo('transactions')}
                    />
                    <NavItem 
                        label="Document Analyzer"
                        icon={<DocumentScanIcon className="w-5 h-5 text-slate-400 transition duration-75 group-hover:text-slate-100" />}
                        isActive={isPageActive('analyzer')}
                        onClick={() => navigateTo('analyzer')}
                    />
                </ul>
            </div>
            
            {/* User Profile Section */}
            {user && (
              <div className="p-4 border-t border-slate-700 bg-slate-800/80">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      @{user.domain}
                    </p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Sign Out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 px-2 py-1 bg-slate-700/50 rounded-md">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide">
                    {user.role === 'c-suite' ? '👔 Executive' : user.role === 'manager' ? '📊 Manager' : '👤 Employee'}
                  </p>
                </div>
              </div>
            )}
        </aside>

        <main className="pl-64 w-full">
            <div className="p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
    </div>
  );
};
