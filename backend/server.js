
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI, Type } = require('@google/genai');
let admin; // will be required only if Firebase credentials are present
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Decode Firebase credentials from environment variable if present (for App Platform deployment)
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 && !fs.existsSync('./serviceAccountKey.json')) {
    try {
        const serviceAccountData = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        fs.writeFileSync('./serviceAccountKey.json', serviceAccountData);
        console.log('✅ Firebase credentials decoded from environment variable');
    } catch (error) {
        console.error('❌ Failed to decode Firebase credentials:', error.message);
    }
}

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({ origin: '*' })); // Allow all origins for testing/deployment flexibility
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// --- Global State ---
// "Internal nodes" variable: In-memory cache of processed file IDs to prevent redundant reads/processing.
// This variable saves time by blocking repetitive database or API queries.
const processedFilesCache = new Set(); 

let isWatcherActive = false;
let watchedFolderId = null;
let watcherTimeout = null;
let automationLogs = [];

// --- Database Adapter Setup ---
// This adapter abstracts the database layer. 
// If Firebase credentials are found/valid, it uses Firestore.
// If not, it uses an in-memory object. This ensures the app works immediately for testing/deploy without config.

let dbMode = 'MEMORY'; // 'FIRESTORE' or 'MEMORY'
let dbAdapter = {};

// In-Memory Storage (Mock DB)
const memoryDb = {
    customers: new Map(),
    transactions: new Map(),
    processed_files: new Map()
};

// Helper to Seed Mock Data
const seedMockData = () => {
    // 1. Seed Demo User
    const mockCustId = 'cust_demo_123';
    memoryDb.customers.set(mockCustId, {
        id: mockCustId,
        name: 'Demo User',
        email: 'demo@example.com',
        contact_phone_number: '555-0123',
        address: '123 Mock St, Test City',
        createdAt: new Date().toISOString()
    });
    
    // 2. Seed Admin User (You)
    const adminId = 'cust_admin_israel';
    memoryDb.customers.set(adminId, {
        id: adminId,
        name: 'Israel Klugman',
        email: 'israel@klugmans.com',
        contact_phone_number: '555-ADMIN',
        address: 'Corporate HQ',
        createdAt: new Date().toISOString()
    });

    // 3. Seed Transaction
    memoryDb.transactions.set('txn_demo_999', {
        id: 'txn_demo_999',
        customerId: mockCustId,
        date: new Date().toISOString(),
        description: 'Demo Activation',
        amount: 50.00,
        status: 'Completed'
    });
};

// Try to Initialize Firebase (only if credentials file exists)
try {
    if (fs.existsSync('./serviceAccountKey.json')) {
        // require firebase-admin lazily so the app can run without the dependency when using in-memory DB
        admin = require('firebase-admin');
        const serviceAccount = require('./serviceAccountKey.json');
        // Prevent re-initialization error
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        const firestore = admin.firestore();

        console.log("✅ CONNECTED TO FIREBASE FIRESTORE");
        // We attempt to infer the project ID, otherwise default to the one provided in setup
        const projectId = serviceAccount.project_id || 'mobile-tech-995ac';
        console.log(`   Project ID: ${projectId} (Verified)`);
        dbMode = 'FIRESTORE';

        // Firestore Implementations
        dbAdapter = {
            getCustomers: async () => {
                const snap = await firestore.collection('customers').get();
                return snap.docs.map(doc => doc.data());
            },
            getTransaction: async (id) => {
                const doc = await firestore.collection('transactions').doc(id).get();
                return doc.exists ? doc.data() : null;
            },
            getTransactions: async () => {
                const snap = await firestore.collection('transactions').get();
                return snap.docs.map(doc => doc.data());
            },
            getCustomer: async (id) => {
                const doc = await firestore.collection('customers').doc(id).get();
                return doc.exists ? doc.data() : null;
            },
            getCustomerByEmail: async (email) => {
                const snap = await firestore.collection('customers').where('email', '==', email).limit(1).get();
                return snap.empty ? null : snap.docs[0].data();
            },
            getCustomerTransactions: async (customerId) => {
                const snap = await firestore.collection('transactions').where('customerId', '==', customerId).get();
                return snap.docs.map(doc => doc.data());
            },
            saveCustomer: async (customer) => {
                await firestore.collection('customers').doc(customer.id).set(customer);
            },
            updateCustomer: async (id, updates) => {
                await firestore.collection('customers').doc(id).update(updates);
                const doc = await firestore.collection('customers').doc(id).get();
                return doc.exists ? doc.data() : null;
            },
            saveTransaction: async (transaction) => {
                await firestore.collection('transactions').doc(transaction.id).set(transaction);
            },
            checkProcessedFile: async (id) => {
                // Optimization: Check variable first (handled in loop), then DB
                const doc = await firestore.collection('processed_files').doc(id).get();
                return doc.exists;
            },
            saveProcessedFile: async (id, data) => {
                await firestore.collection('processed_files').doc(id).set(data);
            },
            // Special initialization to load cache into the variable
            initCache: async () => {
                try {
                    const snap = await firestore.collection('processed_files').select().get();
                    snap.forEach(doc => processedFilesCache.add(doc.id));
                    console.log(`[Cache] Loaded ${processedFilesCache.size} internal nodes from Firestore into memory variable.`);
                } catch (e) {
                    console.error("Error loading cache from Firestore:", e);
                }
            }
        };
    } else {
        throw new Error("serviceAccountKey.json not found");
    }
} catch (error) {
    console.log("⚠️  FIREBASE NOT CONFIGURED - USING IN-MEMORY MOCK DB");
    console.log("   To connect to project 'mobile-tech-995ac', place 'serviceAccountKey.json' in this folder.");
    console.log("   (App is currently in offline-capable demo mode. Data resets on restart.)");
    
    seedMockData();

    // In-Memory Implementations
    dbAdapter = {
        getCustomers: async () => Array.from(memoryDb.customers.values()),
        getTransaction: async (id) => memoryDb.transactions.get(id),
        getTransactions: async () => Array.from(memoryDb.transactions.values()),
        getCustomer: async (id) => memoryDb.customers.get(id),
        getCustomerByEmail: async (email) => {
            return Array.from(memoryDb.customers.values()).find(c => c.email === email);
        },
        getCustomerTransactions: async (customerId) => {
            return Array.from(memoryDb.transactions.values()).filter(t => t.customerId === customerId);
        },
        saveCustomer: async (customer) => memoryDb.customers.set(customer.id, customer),
        updateCustomer: async (id, updates) => {
            const existing = memoryDb.customers.get(id);
            if (existing) {
                const updated = { ...existing, ...updates };
                memoryDb.customers.set(id, updated);
                return updated;
            }
            return null;
        },
        saveTransaction: async (transaction) => memoryDb.transactions.set(transaction.id, transaction),
        checkProcessedFile: async (id) => memoryDb.processed_files.has(id),
        saveProcessedFile: async (id, data) => memoryDb.processed_files.set(id, data),
        initCache: async () => {
            console.log(`[Cache] In-Memory DB initialized. Internal nodes variable ready.`);
        }
    };
}

// Initialize Cache (Load Internal Nodes to Variable)
dbAdapter.initCache().catch(e => console.error("Failed to init cache:", e));

// --- Gemini AI Setup ---
let ai;
try {
    if (!process.env.API_KEY) {
        console.warn("⚠️  GEMINI API KEY MISSING. Manual uploads and automation will fail.");
    } else {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        console.log("✅ Gemini AI Client Initialized");
    }
} catch(e) {
    console.error("Error initializing Gemini client:", e);
}

// --- Drive Logic ---
let drive;
if (dbMode === 'FIRESTORE') { 
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        drive = google.drive({ version: 'v3', auth });
    } catch (e) { console.error("Drive init failed:", e); }
}

// --- Helper Function: Analyze Buffer ---
async function analyzeDocumentBuffer(buffer, mimeType) {
    if (!ai) throw new Error("AI Service not configured (Missing API Key)");

    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: mimeType,
      },
    };
    
    const textPart = {
      text: `Analyze the provided business document (contract, receipt, activation form) for Mobile Tech CRM. Extract information into JSON.
      
      Rules:
      1. Generate unique UUIDs for 'customer_id' and 'transaction_id' if not extracting an existing one.
      2. 'scan_id' should be a unique hash.
      3. Look for Port-In info: Carrier, Account #, PIN.
      4. If a field is missing, use null.`
    };
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scan_id: { type: Type.STRING },
        customer_id: { type: Type.STRING },
        transaction_id: { type: Type.STRING },
        customer_name: { type: Type.STRING, nullable: true },
        customer_address: { type: Type.STRING, nullable: true },
        contact_phone_number: { type: Type.STRING, nullable: true },
        serviced_phone_number: { type: Type.STRING, nullable: true },
        email: { type: Type.STRING, nullable: true },
        imei: { type: Type.STRING, nullable: true },
        iccid: { type: Type.STRING, nullable: true },
        service_plan: { type: Type.STRING, nullable: true },
        plan_term: { type: Type.STRING, nullable: true },
        network_provider: { type: Type.STRING, nullable: true },
        transaction_date: { type: Type.STRING, nullable: true },
        payment_breakdown: { type: Type.STRING, nullable: true },
        total_payment_amount: { type: Type.STRING, nullable: true },
        port_current_carrier: { type: Type.STRING, nullable: true },
        port_account_number: { type: Type.STRING, nullable: true },
        port_pin: { type: Type.STRING, nullable: true },
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

    return JSON.parse(response.text);
}

// --- Helper Function: Save Analysis ---
async function saveAnalysisLogic(data) {
    let customerData;
    
    // 1. Find existing by Email
    let existingCustomer = null;
    if (data.email) {
        existingCustomer = await dbAdapter.getCustomerByEmail(data.email);
    }
    // 2. Fallback: Find by ID
    if (!existingCustomer) {
        existingCustomer = await dbAdapter.getCustomer(data.customer_id);
    }

    if (existingCustomer) {
        customerData = existingCustomer;
        const updates = {};
        if (data.customer_address && data.customer_address !== customerData.address) updates.address = data.customer_address;
        if (data.contact_phone_number && data.contact_phone_number !== customerData.contact_phone_number) updates.contact_phone_number = data.contact_phone_number;
        
        if (Object.keys(updates).length > 0) {
            await dbAdapter.updateCustomer(existingCustomer.id, updates);
            customerData = { ...customerData, ...updates };
        }
    } else {
        // Create New
        customerData = {
            id: data.customer_id,
            name: data.customer_name || 'Unknown Customer',
            email: data.email,
            address: data.customer_address,
            contact_phone_number: data.contact_phone_number,
            createdAt: data.transaction_date || new Date().toISOString(),
        };
        await dbAdapter.saveCustomer(customerData);
    }
    
    const amountString = data.total_payment_amount?.replace(/[^0-9.-]+/g, "") ?? '0';
    const amount = parseFloat(amountString) || 0;

    let description = data.payment_breakdown || 'Scanned Document Transaction';
    if (data.port_current_carrier || data.port_account_number) {
        description = `${description} | Port: ${data.port_current_carrier} (Acct: ${data.port_account_number})`;
    }

    const transactionData = {
        id: data.transaction_id,
        customerId: customerData.id,
        date: data.transaction_date || new Date().toISOString(),
        description: description,
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

    await dbAdapter.saveTransaction(transactionData);
    return { customer: customerData, transaction: transactionData };
}

// --- Logging ---
const addLog = (message, type = 'info') => {
    const log = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message, type };
    automationLogs.unshift(log);
    if (automationLogs.length > 50) automationLogs.pop();
};

// --- Drive Polling ---
const pollDriveFolder = async () => {
    if (!watchedFolderId || !isWatcherActive || !drive) return;

    try {
        const res = await drive.files.list({
            q: `'${watchedFolderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = 'application/pdf')`,
            fields: 'files(id, name, mimeType, modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 10
        });

        const files = res.data.files || [];
        
        for (const file of files) {
            const docId = `${file.id}_${file.modifiedTime}`;

            // CRITICAL OPTIMIZATION: Check internal node variable first.
            // This saves a database read for every file on every poll.
            if (processedFilesCache.has(docId)) {
                continue; 
            }

            // Second Layer: Check Database (in case cache was cleared but DB persists)
            const isProcessed = await dbAdapter.checkProcessedFile(docId);
            if (!isProcessed) {
                addLog(`Processing new file: ${file.name}`, 'info');
                try {
                    const fileData = await drive.files.get({
                        fileId: file.id,
                        alt: 'media',
                    }, { responseType: 'arraybuffer' });

                    const buffer = Buffer.from(fileData.data);
                    const extractedData = await analyzeDocumentBuffer(buffer, file.mimeType);
                    
                    await saveAnalysisLogic(extractedData);
                    
                    // Mark processed in DB
                    await dbAdapter.saveProcessedFile(docId, {
                        fileId: file.id,
                        fileName: file.name,
                        modifiedTime: file.modifiedTime,
                        processedAt: new Date().toISOString(),
                        status: 'success'
                    });
                    
                    // Update Internal Node Variable
                    processedFilesCache.add(docId);
                    addLog(`Successfully processed: ${file.name}`, 'success');
                } catch (err) {
                    console.error(`Error processing file ${file.name}:`, err);
                    addLog(`Failed to process ${file.name}: ${err.message}`, 'error');
                }
            } else {
                // Sync cache if DB had it but memory didn't
                processedFilesCache.add(docId);
            }
        }
    } catch (error) {
        console.error("Drive polling error:", error);
        addLog(`Drive polling error: ${error.message}`, 'error');
    } finally {
        if (isWatcherActive) {
            watcherTimeout = setTimeout(pollDriveFolder, 60000);
        }
    }
};

// --- API Endpoints ---

// Root Endpoint for easy checking
app.get('/', (req, res) => {
    res.send(`Mobile Tech CRM Backend is RUNNING. Mode: ${dbMode}`);
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', dbMode: dbMode, cacheSize: processedFilesCache.size });
});

// Drive Config
app.post('/api/drive/configure', (req, res) => {
    const { folderId, active } = req.body;
    if (folderId) watchedFolderId = folderId;
    
    if (active && !isWatcherActive) {
        if (!drive && dbMode !== 'FIRESTORE') {
            return res.status(400).json({ active: false, message: "Cannot start: Drive API not configured (no credentials)." });
        }
        isWatcherActive = true;
        addLog(`Starting watcher on folder ${folderId}...`, 'success');
        pollDriveFolder();
    } else if (!active && isWatcherActive) {
        isWatcherActive = false;
        if (watcherTimeout) clearTimeout(watcherTimeout);
        addLog('Watcher stopped.', 'info');
    }
    res.json({ active: isWatcherActive, folderId: watchedFolderId });
});

app.get('/api/drive/status', (req, res) => {
    res.json({ active: isWatcherActive, folderId: watchedFolderId, logs: automationLogs });
});

// Document Analysis
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    try {
        const extractedData = await analyzeDocumentBuffer(req.file.buffer, req.file.mimetype);
        res.json(extractedData);
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({ error: error.message || 'Failed to analyze document.' });
    }
});

app.post('/api/save-analysis', async (req, res) => {
    try {
        const result = await saveAnalysisLogic(req.body);
        res.status(201).json(result);
    } catch(error) {
        console.error("Save error:", error);
        res.status(500).json({ error: "Failed to save data." });
    }
});

// Data Access
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await dbAdapter.getCustomers();
        res.json(customers);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        const customer = await dbAdapter.getCustomer(req.params.id);
        customer ? res.json(customer) : res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const updatedCustomer = await dbAdapter.updateCustomer(req.params.id, req.body);
        updatedCustomer ? res.json(updatedCustomer) : res.status(404).json({ error: 'Customer not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
    try {
        const transactions = await dbAdapter.getCustomerTransactions(req.params.id);
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await dbAdapter.getTransactions();
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = { ...req.body, id: `txn_${crypto.randomUUID()}` };
        await dbAdapter.saveTransaction(newTx);
        res.status(201).json(newTx);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Serve Frontend (Production) ---
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, 'public');
    
    // Serve static files from the frontend build
    app.use(express.static(frontendPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`\n🚀 Mobile Tech CRM Backend running on http://localhost:${port}`);
    console.log(`   DB Mode: ${dbMode}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Admin User: israel@klugmans.com (Available via mock data)\n`);
});