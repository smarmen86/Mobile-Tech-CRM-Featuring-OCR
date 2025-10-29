import React, { useState, useEffect, useMemo } from 'react';
import { getTransactions, getCustomers } from '../services/db';
import { Transaction, Customer } from '../types';

interface TransactionsPageProps {
    viewCustomer: (customerId: string) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ viewCustomer }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [transactionData, customerData] = await Promise.all([
                    getTransactions(),
                    getCustomers()
                ]);
                setTransactions(transactionData);
                setCustomers(customerData);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
                console.error("Failed to fetch transactions page data:", err);
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const customerMap = useMemo(() => {
        return new Map(customers.map(c => [c.id, c.name]));
    }, [customers]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const customerName = customerMap.get(tx.customerId) || '';
            return (
                customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm, customerMap]);

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-100">All Transactions</h1>
                <p className="text-lg text-slate-400 mt-2">A complete log of all payments and transactions.</p>
            </header>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by customer, description, or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg bg-slate-700 border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-300 sm:pl-6">Customer</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Description</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-300">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 bg-slate-900/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-400">Loading transactions...</td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-red-400">
                                    <p className="font-semibold">Failed to load transactions.</p>
                                    <p className="text-sm">{error}</p>
                                </td>
                            </tr>
                        ) : filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-700/50">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-cyan-400 sm:pl-6 cursor-pointer hover:underline" onClick={() => viewCustomer(tx.customerId)}>
                                    {customerMap.get(tx.customerId) || 'N/A'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{tx.description}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'Completed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-mono text-slate-100">${tx.amount.toFixed(2)}</td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-400">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};