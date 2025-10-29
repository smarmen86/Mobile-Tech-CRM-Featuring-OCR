export interface PaymentDetails {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    amount: number;
    customerId: string;
}

export interface PaymentResponse {
    success: boolean;
    transactionId: string;
    message: string;
}

const API_BASE_URL = 'http://localhost:3001/api';


/**
 * Processes a payment by sending the details to the backend server.
 * @param details - The payment card and customer details.
 * @returns A promise that resolves with the payment response from the server.
 */
export const processPayment = async (details: PaymentDetails): Promise<PaymentResponse> => {
    console.log("Sending payment details to backend:", details);

    if (!details.cardNumber || !details.expiryDate || !details.cvv || details.amount <= 0) {
        return Promise.reject(new Error("Invalid payment details provided."));
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Payment processing failed.' }));
            throw new Error(errorData.message);
        }

        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Could not connect to the payment service. Please ensure the backend server is running.');
        }
        // Re-throw other errors for the component to handle
        throw error;
    }
};