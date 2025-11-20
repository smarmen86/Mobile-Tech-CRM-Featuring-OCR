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

/**
 * Processes a payment by simulating a gateway request.
 * @param details - The payment card and customer details.
 * @returns A promise that resolves with the payment response.
 */
export const processPayment = async (details: PaymentDetails): Promise<PaymentResponse> => {
    console.log("Processing payment client-side:", details);

    if (!details.cardNumber || !details.expiryDate || !details.cvv || details.amount <= 0) {
        return Promise.reject(new Error("Invalid payment details provided."));
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation simulation
    if (details.cardNumber.length < 10) {
        return {
            success: false,
            transactionId: '',
            message: 'Card declined: Invalid card number.',
        };
    }

    return {
        success: true,
        transactionId: `sola_${crypto.randomUUID()}`,
        message: `Payment of $${details.amount.toFixed(2)} successful.`,
    };
};