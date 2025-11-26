import React, { useState, useEffect, useCallback } from 'react';
import { getCustomerById, getTransactionsByCustomerId, addTransaction, updateCustomer } from '../services/db';
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
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        contact_phone_number: '',
        address: ''
    });
    
    const fetchCustomerData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const foundCustomer = await getCustomerById(customerId);
            if(foundCustomer) {
                setCustomer(foundCustomer);
                setEditForm({
                    email: foundCustomer.email || '',
                    contact_phone_number: foundCustomer.contact_phone_number || '',
                    address: foundCustomer.address || ''
                });
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

    const handleEditToggle = () => {
        if (isEditing && customer) {
            // Reset form if canceling
            setEditForm({
                email: customer.email || '',
                contact_phone_number: customer.contact_phone_number || '',
                address: customer.address || ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveEdit = async () => {
        if (!customer) return;
        
        try {
            const updatedCustomer = {
                ...customer,
                email: editForm.email,
                contact_phone_number: editForm.contact_phone_number,
                address: editForm.address
            };
            
            await updateCustomer(customer.id, updatedCustomer);
            setCustomer(updatedCustomer);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update customer:", error);
            alert("Failed to update customer information. Please try again.");
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-cyan-300">Contact Information</h3>
                            <button
                                onClick={handleEditToggle}
                                className="text-sm px-3 py-1 rounded-lg border border-slate-600 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={editForm.contact_phone_number}
                                        onChange={(e) => setEditForm({ ...editForm, contact_phone_number: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Address</label>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveEdit}
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <dl className="space-y-4">
                                <DetailItem label="Email Address" value={customer.email} />
                                <DetailItem label="Contact Phone" value={customer.contact_phone_number} />
                                <DetailItem label="Address" value={customer.address} />
                                <DetailItem label="Customer ID" value={customer.id} />
                            </dl>
                        )}
                    </div>
                    {/* Payment Form */}
                    <PaymentForm customerId={customer.id} onPaymentSuccess={handlePaymentSuccess} />
                </div>
            </div>
        </div>
    );
};