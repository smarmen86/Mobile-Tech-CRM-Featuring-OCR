import React, { useState } from 'react';
import { processPayment, PaymentResponse } from '../services/solaPaymentsService';
import { Spinner } from './Spinner';
import { LockIcon } from './icons/LockIcon';

interface PaymentFormProps {
    customerId: string;
    onPaymentSuccess: (transactionId: string, amount: number) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ customerId, onPaymentSuccess }) => {
    const [amount, setAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PaymentResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            setError("Please enter a valid amount.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await processPayment({
                customerId, // Pass customerId to the backend
                cardNumber,
                expiryDate,
                cvv,
                amount: amountNumber
            });
            setResult(response);
            if (response.success) {
                onPaymentSuccess(response.transactionId, amountNumber);
                // Reset form
                setAmount('');
                setCardNumber('');
                setExpiryDate('');
                setCvv('');
            } else {
                setError(response.message);
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred."
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-cyan-300">Process New Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">Amount ($)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50.00" className="w-full bg-slate-700 border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                </div>
                <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-400 mb-1">Card Number</label>
                    <input type="text" id="cardNumber" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="•••• •••• •••• ••••" className="w-full bg-slate-700 border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-400 mb-1">Expiry Date</label>
                        <input type="text" id="expiryDate" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="MM/YY" className="w-full bg-slate-700 border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="cvv" className="block text-sm font-medium text-slate-400 mb-1">CVV</label>
                        <input type="text" id="cvv" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="•••" className="w-full bg-slate-700 border-slate-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500" required />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    {isLoading ? <Spinner /> : <><LockIcon className="w-5 h-5 mr-2"/> Process Payment</>}
                </button>
            </form>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            {result && result.success && <p className="text-green-400 mt-4 text-center">{result.message}</p>}
             <p className="text-xs text-slate-500 mt-4 text-center">Powered by Sola Payments</p>
        </div>
    );
};
