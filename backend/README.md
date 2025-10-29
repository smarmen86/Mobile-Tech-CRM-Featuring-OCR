# Mobile Tech CRM Backend

This is the backend server for the Mobile Tech CRM application. It handles document analysis via the Gemini API, manages customer and transaction data, and processes payments.

## Setup

1.  **Install Dependencies:**
    Navigate to this `backend` directory in your terminal and run:
    ```bash
    npm install
    ```

2.  **Set Environment Variables:**
    Create a file named `.env` in this `backend` directory and add your Gemini API key:
    ```
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    The server is configured to use `dotenv` to load this key securely.

## Running the Server

To start the server, run the following command from the `backend` directory:

```bash
npm start
```

The server will start on `http://localhost:3001`. The frontend application is configured to communicate with this address.
