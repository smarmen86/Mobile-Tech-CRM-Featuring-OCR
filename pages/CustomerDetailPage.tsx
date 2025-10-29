import React, { useState, useEffect, useCallback } from 'react';
import { getCustomerById, getTransactionsByCustomerId, addTransaction } from '../services/db';
import { Customer, Transaction } from '../types';
import { PaymentForm } from '../components/PaymentForm';

interface CustomerDetailPageProps {
    customerId: string;
}

const DetailItem: React.FC<{ label: string, value: string | null | undefined }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-slate-100">{value || 'N/A'}</dd>
    </div>
);

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customerId }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchCustomerData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const foundCustomer = await getCustomerById(customerId);
            if(foundCustomer) {
                setCustomer(foundCustomer);
                const customerTransactions = await getTransactionsByCustomerId(customerId);
                setTransactions(customerTransactions);
            } else {
                throw new Error("Customer not found.");
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
            console.error("Failed to fetch customer details:", err);
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [customerId]);
    
    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);
    
    const handlePaymentSuccess = async (transactionId: string, amount: number) => {
        if (!customer) return;
        
        const newTransactionData = {
            customerId: customer.id,
            date: new Date().toISOString(),
            description: `Online Payment - Ref: ${transactionId}`,
            amount: amount,
            status: 'Completed' as const
        };
        
        try {
            await addTransaction(newTransactionData);
            // Refresh transactions list from the server
            fetchCustomerData();
        } catch(error) {
            console.error("Failed to add new transaction:", error);
        }
    };

    if (isLoading) {
        return <div className="text-center text-slate-400 p-8">Loading customer data...</div>;
    }
    
    if (error) {
        return (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Customer Data</h1>
                <p className="text-slate-400 max-w-md mb-6">{error}</p>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-left text-sm">
                    <p className="font-semibold text-slate-300">Troubleshooting Steps:</p>
                    <ul className="list-disc list-inside mt-2 text-slate-400 space-y-1">
                        <li>Ensure the backend server is running.</li>
                        <li>Verify the customer ID is correct.</li>
                    </ul>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return <div className="text-center text-slate-400 p-8">Customer not found.</div>;
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-100">{customer.name}</h1>
                <p className="text-lg text-slate-400 mt-2">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Transactions List */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 text-cyan-300">Transaction History</h3>
                        <div className="flow-root">
                            <ul role="list" className="-my-4 divide-y divide-slate-700">
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <li key={tx.id} className="flex items-center py-4 space-x-4">
                                        <div className="flex-auto">
                                            <p className="text-slate-100 font-semibold">{tx.description}</p>
                                            <p className="text-sm text-slate-400">
                                                {new Date(tx.date).toLocaleString()} - Status: {tx.status}
                                            </p>
                                            {tx.plan?.name && <p className="text-xs text-slate-500">Plan: {tx.plan.name} ({tx.plan.term})</p>}
                                            {tx.device?.imei && <p className="text-xs text-slate-500">IMEI: {tx.device.imei}</p>}
                                        </div>
                                        <div className="text-right">
                                           <p className="text-lg font-mono font-semibold text-cyan-300">${tx.amount.toFixed(2)}</p>
                                        </div>
                                    </li>
                                )) : (
                                    <p className="text-slate-400 text-center py-4">No transactions found.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                     {/* Contact Info */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 text-cyan-300">Contact Information</h3>
                        <dl className="space-y-4">
                            <DetailItem label="Email Address" value={customer.email} />
                            <DetailItem label="Contact Phone" value={customer.contact_phone_number} />
                            <DetailItem label="Address" value={customer.address} />
                            <DetailItem label="Customer ID" value={customer.id} />
                        </dl>
                    </div>
                    {/* Payment Form */}
                    <PaymentForm customerId={customer.id} onPaymentSuccess={handlePaymentSuccess} />
                </div>
            </div>
        </div>
    );
};