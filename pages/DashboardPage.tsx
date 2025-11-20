import React, { useState, useEffect, useMemo } from 'react';
import { getCustomers, getTransactions } from '../services/db';
import { Customer, Transaction } from '../types';

interface DashboardPageProps {
     viewCustomer: (customerId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
        <div className="bg-slate-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);


export const DashboardPage: React.FC<DashboardPageProps> = ({ viewCustomer }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [customerData, transactionData] = await Promise.all([
                    getCustomers(),
                    getTransactions()
                ]);
                setCustomers(customerData);
                setTransactions(transactionData);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
                console.error("Failed to fetch dashboard data:", err);
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenue = useMemo(() => {
        return transactions.reduce((sum, tx) => sum + tx.amount, 0);
    }, [transactions]);
    
    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);
    
    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Dashboard</h1>
                <p className="text-slate-400 max-w-md mb-6">{error}</p>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-left text-sm">
                    <p className="font-semibold text-slate-300">Troubleshooting Steps:</p>
                    <ul className="list-disc list-inside mt-2 text-slate-400 space-y-1">
                        <li>Ensure the backend server is running. Navigate to the `backend` folder and run `npm start`.</li>
                        <li>Check your browser's console for more detailed network errors.</li>
                        <li>Verify the backend is accessible at `http://localhost:3001`.</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-lg text-slate-400 mt-2">Welcome back! Here's a summary of your business.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title="Total Customers" 
                    value={isLoading ? '...' : customers.length.toString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                 <StatCard 
                    title="Total Revenue" 
                    value={isLoading ? '...' : `$${totalRevenue.toFixed(2)}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1h-4zm-4 6v-1h4v1h-4zm-2 3v-1h8v1h-8a1 1 0 01-1-1zm14-4v-1h-4v1h4z" /></svg>}
                />
                 <StatCard 
                    title="Total Transactions" 
                    value={isLoading ? '...' : transactions.length.toString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
            </div>
            
             <div className="bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-xl font-bold p-6 border-b border-slate-700 text-cyan-300">Recent Transactions</h3>
                <div className="flow-root">
                    <ul role="list" className="divide-y divide-slate-700">
                        {isLoading ? (
                            <p className="text-slate-400 text-center py-10">Loading transactions...</p>
                        ) : recentTransactions.length > 0 ? recentTransactions.map(tx => (
                            <li key={tx.id} className="flex items-center p-4 sm:p-6 hover:bg-slate-700/50">
                                <div className="flex-auto cursor-pointer" onClick={() => viewCustomer(tx.customerId)}>
                                    <p className="text-slate-100 font-semibold">{getCustomerName(tx.customerId)}</p>
                                    <p className="text-sm text-slate-400">
                                        {tx.description}
                                    </p>
                                </div>
                                <div className="text-right">
                                   <p className="text-lg font-mono font-semibold text-cyan-300">${tx.amount.toFixed(2)}</p>
                                   <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </li>
                        )) : (
                            <p className="text-slate-400 text-center py-10">No transactions yet.</p>
                        )}
                    </ul>
                </div>
            </div>

        </div>
    );
};