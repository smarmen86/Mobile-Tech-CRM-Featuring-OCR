require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI, Type } = require('@google/genai');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
// Make sure you have the 'serviceAccountKey.json' in your backend directory
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Successfully connected to Firebase.");
} catch (error) {
    console.error("Firebase initialization failed. Make sure 'serviceAccountKey.json' is present in the /backend directory.");
    console.error(error);
    process.exit(1); // Exit if Firebase can't be initialized
}

const db = admin.firestore();
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// --- Gemini AI Setup ---
if (!process.env.API_KEY) {
  throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable in a .env file.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- API Endpoints ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running and connected to services.' });
});


// Analyze a document with Gemini
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };
    
    const textPart = {
      text: `Analyze the provided business document (like a contract, receipt, or activation form) from a mobile tech store. Extract the following information and return it as a JSON object. If a field is not present, use a value of null. The customer_id should be a new, unique ID in UUID format. The transaction_id should also be a new, unique ID in UUID format. The scan_id can be a random hash or UUID.`
    };
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scan_id: { type: Type.STRING },
        customer_id: { type: Type.STRING },
        transaction_id: { type: Type.STRING },
        customer_name: { type: Type.STRING },
        customer_address: { type: Type.STRING },
        contact_phone_number: { type: Type.STRING },
        serviced_phone_number: { type: Type.STRING },
        email: { type: Type.STRING },
        imei: { type: Type.STRING },
        iccid: { type: Type.STRING },
        service_plan: { type: Type.STRING },
        plan_term: { type: Type.STRING },
        network_provider: { type: Type.STRING },
        transaction_date: { type: Type.STRING },
        payment_breakdown: { type: Type.STRING },
        total_payment_amount: { type: Type.STRING },
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\n?/, '').replace(/```$/, '');
    const extractedData = JSON.parse(cleanedJsonText);
    
    res.json(extractedData);

  } catch (error) {
    console.error("Error analyzing document with Gemini on backend:", error);
    res.status(500).json({ error: 'Failed to analyze document with AI.' });
  }
});

// Save extracted data to the database
app.post('/api/save-analysis', async (req, res) => {
    try {
        const data = req.body;

        // Use the customer_id from Gemini as the document ID
        const customerRef = db.collection('customers').doc(data.customer_id);
        const customerDoc = await customerRef.get();

        let customerData;
        if (!customerDoc.exists) {
            customerData = {
                id: data.customer_id,
                name: data.customer_name,
                email: data.email,
                address: data.customer_address,
                contact_phone_number: data.contact_phone_number,
                createdAt: data.transaction_date || new Date().toISOString(),
            };
            await customerRef.set(customerData);
        } else {
            customerData = customerDoc.data();
        }
        
        const amountString = data.total_payment_amount?.replace(/[^0-9.-]+/g, "") ?? '0';
        const amount = parseFloat(amountString) || 0;

        const transactionData = {
            id: data.transaction_id,
            customerId: data.customer_id,
            date: data.transaction_date || new Date().toISOString(),
            description: data.payment_breakdown || 'Scanned Document Transaction',
            amount: amount,
            status: 'Completed',
            scanId: data.scan_id,
            device: {
                imei: data.imei,
                iccid: data.iccid,
                serviced_phone_number: data.serviced_phone_number,
                network_provider: data.network_provider,
            },
            plan: { name: data.service_plan, term: data.plan_term }
        };

        await db.collection('transactions').doc(data.transaction_id).set(transactionData);
        
        res.status(201).json({ customer: customerData, transaction: transactionData });
    } catch(error) {
        console.error("Error saving analysis to Firestore:", error);
        res.status(500).json({ error: "Failed to save data to database." });
    }
});


// Customer and Transaction Data Endpoints
app.get('/api/customers', async (req, res) => {
    const snapshot = await db.collection('customers').get();
    const customers = snapshot.docs.map(doc => doc.data());
    res.json(customers);
});

app.get('/api/transactions', async (req, res) => {
    const snapshot = await db.collection('transactions').get();
    const transactions = snapshot.docs.map(doc => doc.data());
    res.json(transactions);
});

app.get('/api/customers/:id', async (req, res) => {
  const doc = await db.collection('customers').doc(req.params.id).get();
  if (doc.exists) {
    res.json(doc.data());
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
    const snapshot = await db.collection('transactions').where('customerId', '==', req.params.id).get();
    const transactions = snapshot.docs.map(doc => doc.data());
    res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
    const newTransactionId = `txn_${crypto.randomUUID()}`;
    const newTransaction = {
        ...req.body,
        id: newTransactionId,
    };
    await db.collection('transactions').doc(newTransactionId).set(newTransaction);
    res.status(201).json(newTransaction);
});

// Payment Processing Endpoint
app.post('/api/process-payment', (req, res) => {
    const { amount } = req.body;
    // In a real app, integrate with a payment gateway like Stripe or Braintree here.
    console.log("Processing payment on backend for:", req.body);
    setTimeout(() => {
        res.json({
            success: true,
            transactionId: `sola_${crypto.randomUUID()}`,
            message: `Payment of $${amount.toFixed(2)} successful.`,
        });
    }, 1500);
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Mobile Tech CRM backend listening on http://localhost:${port}`);
});