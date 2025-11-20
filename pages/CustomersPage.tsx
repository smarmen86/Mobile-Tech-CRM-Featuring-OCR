import React, { useState, useEffect, useMemo } from 'react';
import { getCustomers } from '../services/db';
import { Customer } from '../types';
import { UsersIcon } from '../components/icons/UsersIcon';

interface CustomersPageProps {
    viewCustomer: (customerId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ viewCustomer }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const customerData = await getCustomers();
                setCustomers(customerData);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
                console.error("Failed to fetch customers:", err);
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer =>
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.contact_phone_number?.includes(searchTerm)
        ).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    }, [customers, searchTerm]);

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-100">Customers</h1>
                <p className="text-lg text-slate-400 mt-2">Manage and view all customer profiles.</p>
            </header>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg bg-slate-700 border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>

            <div className="bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
                 {error ? (
                    <div className="text-center p-10">
                        <h3 className="text-xl font-bold text-red-400">Failed to Load Customers</h3>
                        <p className="text-slate-400 mt-2">{error}</p>
                    </div>
                 ) : (
                    <div className="flow-root">
                         <ul role="list" className="divide-y divide-slate-700">
                            {isLoading ? (
                                 <p className="text-slate-400 text-center py-10">Loading customers...</p>
                            ) : filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                <li key={customer.id} className="flex items-center p-4 sm:p-6 hover:bg-slate-700/50 cursor-pointer" onClick={() => viewCustomer(customer.id)}>
                                    <div className="flex-shrink-0 h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center">
                                        <UsersIcon className="w-5 h-5 text-slate-400"/>
                                    </div>
                                    <div className="ml-4 flex-auto">
                                        <p className="text-lg font-semibold text-cyan-300">{customer.name}</p>
                                        <p className="text-sm text-slate-400">{customer.email}</p>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <p className="text-sm text-slate-300">{customer.contact_phone_number}</p>
                                        <p className="text-xs text-slate-500">Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </li>
                            )) : (
                                 <p className="text-slate-400 text-center py-10">No customers found.</p>
                            )}
                        </ul>
                    </div>
                 )}
            </div>
        </div>
    );
};