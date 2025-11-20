
import { Customer, Transaction, ExtractedData } from '../types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://kmt.klugmans.com/api';

// Helper for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Connection timed out. The backend server at ${API_BASE_URL} may be offline or sleeping.`);
        }
        // Propagate generic network errors (e.g., Failed to fetch)
        throw error;
    }
};

// --- Customer Management ---

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/customers`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server Error (${response.status}): ${text}`);
    }
    return response.json();
  } catch (error) {
    console.error("getCustomers failed:", error);
    throw new Error(`Could not connect to the backend server at ${API_BASE_URL}.`);
  }
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) {
        throw new Error('Failed to fetch customer');
    }
    return response.json();
  } catch (error) {
    throw new Error("Failed to retrieve customer details.");
  }
};

// --- Transaction Management ---

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/transactions`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  } catch (error) {
    console.error("getTransactions failed:", error);
    throw new Error("Failed to load transactions.");
  }
};

export const getTransactionsByCustomerId = async (customerId: string): Promise<Transaction[]> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/customers/${customerId}/transactions`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions for customer');
  }
  return response.json();
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    throw new Error('Failed to create transaction');
  }
  return response.json();
};

// --- Data Extraction and Saving ---

export const addCustomerFromExtraction = async (data: ExtractedData): Promise<{ customer: Customer, transaction: Transaction }> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/save-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save analysis data to server');
  }
  return response.json();
};
