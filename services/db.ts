// services/db.ts
import { Customer, Transaction, ExtractedData } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * A centralized fetch wrapper for API calls to the backend.
 * Handles network errors and non-OK responses gracefully.
 */
const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred' }));
            throw new Error(errorData.message || `Server responded with status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json() as Promise<T>;
        } else {
            // Handle cases like 204 No Content
            return Promise.resolve(undefined as unknown as T);
        }

    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Could not connect to the backend. Please ensure the server is running on http://localhost:3001.');
        }
        // Re-throw other errors (including the ones we threw from the !response.ok check)
        throw error;
    }
};


// --- Customer Management ---

export const getCustomers = (): Promise<Customer[]> => apiFetch('/customers');

export const getCustomerById = (id: string): Promise<Customer | undefined> => apiFetch(`/customers/${id}`);

// --- Transaction Management ---

export const getTransactions = (): Promise<Transaction[]> => apiFetch('/transactions');

export const getTransactionsByCustomerId = (customerId: string): Promise<Transaction[]> => apiFetch(`/customers/${customerId}/transactions`);

export const addTransaction = (transactionData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    return apiFetch('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
    });
};


// --- Data Extraction and Saving ---

export const addCustomerFromExtraction = (data: ExtractedData): Promise<{ customer: Customer, transaction: Transaction }> => {
    return apiFetch('/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};