import React, { useState, useEffect, useMemo } from 'react';
import { getCustomers, getTransactions } from '../../services/db';
import { Customer, Transaction } from '../../types';

interface EmployeeDashboardProps {
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

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ viewCustomer }) => {
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

    const metrics = useMemo(() => {
        const today = new Date();
        const todayTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.toDateString() === today.toDateString();
        });

        const pendingTransactions = transactions.filter(tx => tx.status === 'Pending');

        return {
            totalCustomers: customers.length,
            todayTransactions: todayTransactions.length,
            totalTransactions: transactions.length,
            pendingCount: pendingTransactions.length
        };
    }, [customers, transactions]);

    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [transactions]);

    const recentCustomers = useMemo(() => {
        return customers
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [customers]);

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Dashboard</h1>
                <p className="text-slate-400 max-w-md mb-6">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-100">My Dashboard</h1>
                <p className="text-lg text-slate-400 mt-2">Today's tasks and recent customer activity</p>
            </header>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Customers" 
                    value={isLoading ? '...' : metrics.totalCustomers.toString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <StatCard 
                    title="Today's Transactions" 
                    value={isLoading ? '...' : metrics.todayTransactions.toString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <StatCard 
                    title="Total Transactions" 
                    value={isLoading ? '...' : metrics.totalTransactions.toString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <StatCard 
                    title="Pending Tasks" 
                    value={isLoading ? '...' : metrics.pendingCount.toString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-cyan-300">Recent Transactions</h3>
                    <div className="flow-root">
                        <ul role="list" className="-my-4 divide-y divide-slate-700">
                            {recentTransactions.map(tx => (
                                <li key={tx.id} className="flex items-center py-4 space-x-4">
                                    <div className="flex-auto">
                                        <p className="text-slate-100 font-semibold">{getCustomerName(tx.customerId)}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(tx.date).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${tx.status === 'Completed' ? 'text-green-400' : tx.status === 'Pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recent Customers */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-cyan-300">Recent Customers</h3>
                    <div className="space-y-3">
                        {recentCustomers.map(customer => (
                            <div 
                                key={customer.id}
                                onClick={() => viewCustomer(customer.id)}
                                className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                                <p className="text-slate-100 font-semibold">{customer.name}</p>
                                <p className="text-sm text-slate-400">{customer.email}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Added {new Date(customer.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
