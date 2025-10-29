import React from 'react';
import { Page } from '../App';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { DocumentScanIcon } from './icons/DocumentScanIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { ServerStatusBanner } from './ServerStatusBanner';

interface LayoutProps {
  children: React.ReactNode;
  navigateTo: (page: Page) => void;
  currentPage: Page;
  isServerOnline: boolean | null;
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

export const Layout: React.FC<LayoutProps> = ({ children, navigateTo, currentPage, isServerOnline }) => {
  const mainPages: Page[] = ['dashboard', 'customers', 'transactions', 'analyzer'];
  const isPageActive = (page: Page) => mainPages.includes(currentPage) ? currentPage === page : false;
    
  return (
    <div className="flex">
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto bg-slate-800/50 border-r border-slate-700">
                <div className="text-center mb-8 mt-4">
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        Mobile Tech CRM
                    </h1>
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
        </aside>

        <main className="pl-64 w-full">
            {isServerOnline === false && <ServerStatusBanner />}
            <div className="p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
    </div>
  );
};