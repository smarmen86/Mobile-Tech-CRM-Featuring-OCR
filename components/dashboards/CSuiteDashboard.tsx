import React, { useState, useEffect, useMemo } from 'react';
import { getCustomers, getTransactions } from '../../services/db';
import { Customer, Transaction } from '../../types';

interface CSuiteDashboardProps {
    viewCustomer: (customerId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string }> = ({ title, value, icon, trend }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
        <div className="bg-slate-700 p-3 rounded-full">{icon}</div>
        <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
            {trend && <p className="text-xs text-cyan-400 mt-1">{trend}</p>}
        </div>
    </div>
);

export const CSuiteDashboard: React.FC<CSuiteDashboardProps> = ({ viewCustomer }) => {
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
        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const completedTransactions = transactions.filter(tx => tx.status === 'Completed');
        const pendingRevenue = transactions.filter(tx => tx.status === 'Pending').reduce((sum, tx) => sum + tx.amount, 0);
        
        // Calculate monthly growth (mock calculation for demo)
        const currentMonth = new Date().getMonth();
        const currentMonthTransactions = transactions.filter(tx => new Date(tx.date).getMonth() === currentMonth);
        const currentMonthRevenue = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        
        return {
            totalRevenue,
            totalCustomers: customers.length,
            totalTransactions: transactions.length,
            completedTransactions: completedTransactions.length,
            pendingRevenue,
            currentMonthRevenue,
            averageTransactionValue: transactions.length > 0 ? totalRevenue / transactions.length : 0
        };
    }, [customers, transactions]);

    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [transactions]);

    const topCustomers = useMemo(() => {
        const customerRevenue = new Map<string, number>();
        transactions.forEach(tx => {
            const current = customerRevenue.get(tx.customerId) || 0;
            customerRevenue.set(tx.customerId, current + tx.amount);
        });
        
        return Array.from(customerRevenue.entries())
            .map(([customerId, revenue]) => ({
                customer: customers.find(c => c.id === customerId),
                revenue
            }))
            .filter(item => item.customer)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [customers, transactions]);

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
                <h1 className="text-4xl font-bold text-slate-100">Executive Dashboard</h1>
                <p className="text-lg text-slate-400 mt-2">Comprehensive business overview and key performance indicators</p>
            </header>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Revenue" 
                    value={isLoading ? '...' : `$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    trend={`$${metrics.currentMonthRevenue.toFixed(2)} this month`}
                />
                <StatCard 
                    title="Total Customers" 
                    value={isLoading ? '...' : metrics.totalCustomers.toString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <StatCard 
                    title="Avg Transaction Value" 
                    value={isLoading ? '...' : `$${metrics.averageTransactionValue.toFixed(2)}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                />
                <StatCard 
                    title="Pending Revenue" 
                    value={isLoading ? '...' : `$${metrics.pendingRevenue.toFixed(2)}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Customers by Revenue */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-cyan-300">Top Customers by Revenue</h3>
                    <div className="space-y-3">
                        {topCustomers.map((item, idx) => (
                            <div 
                                key={item.customer?.id}
                                onClick={() => item.customer && viewCustomer(item.customer.id)}
                                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-slate-900 font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-slate-100 font-semibold">{item.customer?.name}</p>
                                        <p className="text-xs text-slate-400">{item.customer?.email}</p>
                                    </div>
                                </div>
                                <p className="text-green-400 font-bold">${item.revenue.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-cyan-300">Recent Transactions</h3>
                    <div className="flow-root">
                        <ul role="list" className="-my-2 divide-y divide-slate-700">
                            {recentTransactions.slice(0, 5).map(tx => {
                                const customer = customers.find(c => c.id === tx.customerId);
                                return (
                                    <li key={tx.id} className="py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-100 truncate">{customer?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm font-mono font-semibold text-cyan-300">${tx.amount.toFixed(2)}</p>
                                                <p className={`text-xs ${tx.status === 'Completed' ? 'text-green-400' : tx.status === 'Pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {tx.status}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
