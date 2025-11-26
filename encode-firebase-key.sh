#!/bin/bash

# Helper script to encode Firebase credentials for DigitalOcean App Platform

if [ ! -f "backend/serviceAccountKey.json" ]; then
    echo "❌ Error: backend/serviceAccountKey.json not found!"
    echo "Please make sure your Firebase service account key is in the backend folder."
    exit 1
fi

echo "📦 Encoding Firebase credentials to base64..."
echo ""

BASE64_ENCODED=$(cat backend/serviceAccountKey.json | base64 -w 0 2>/dev/null || cat backend/serviceAccountKey.json | base64)

echo "✅ Done! Copy the base64 string below:"
echo ""
echo "================================================"
echo "$BASE64_ENCODED"
echo "================================================"
echo ""
echo "📝 Instructions:"
echo "1. Go to your DigitalOcean App Platform settings"
echo "2. Navigate to Environment Variables"
echo "3. Add a new variable:"
echo "   Name: FIREBASE_SERVICE_ACCOUNT_BASE64"
echo "   Value: <paste the base64 string above>"
echo "4. Redeploy your app"
echo ""
