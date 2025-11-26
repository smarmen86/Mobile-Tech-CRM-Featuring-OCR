# Quick Start: Deploy to DigitalOcean

## Option A: Using DigitalOcean App Platform (Easiest - 5 minutes)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create App in DigitalOcean:**
   - Go to: https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect GitHub → Select your repo
   - Use these settings:
     - **Resource Type:** Dockerfile
     - **Dockerfile Path:** `Dockerfile`
     - **HTTP Port:** `3001`

3. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   NODE_ENV=production
   PORT=3001
   API_KEY=<your-gemini-api-key>
   ```

4. **Add Firebase Credentials:**
   On your computer:
   ```bash
   cat backend/serviceAccountKey.json | base64 -w 0
   ```
   Copy the output and add as environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_BASE64=<paste-base64-here>
   ```

5. **Update server.js** (one-time):
   Add this at the top of `backend/server.js` after requires:
   ```javascript
   // Decode Firebase credentials from environment if present
   if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 && !fs.existsSync('./serviceAccountKey.json')) {
       const serviceAccountData = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
       fs.writeFileSync('./serviceAccountKey.json', serviceAccountData);
   }
   ```

6. **Deploy:** Click "Create Resources" - Done! You'll get a URL.

---

## Option B: Using a DigitalOcean Droplet (15 minutes)

### 1. Create Droplet
- Size: **Basic $6/month** (1GB RAM minimum)
- Image: **Ubuntu 24.04 LTS**
- Add your SSH key

### 2. Connect and Deploy
SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Run these commands:
```bash
# Clone the repository
cd /opt
git clone https://github.com/smarmen86/Mobile-Tech-CRM-Featuring-OCR.git
cd Mobile-Tech-CRM-Featuring-OCR

# Run the deployment script
sudo ./deploy.sh
```

### 3. Upload Credentials
From your local machine:
```bash
# Upload Firebase credentials
scp backend/serviceAccountKey.json root@YOUR_DROPLET_IP:/opt/Mobile-Tech-CRM-Featuring-OCR/backend/

# SSH back in and update .env
ssh root@YOUR_DROPLET_IP
cd /opt/Mobile-Tech-CRM-Featuring-OCR
nano backend/.env  # Add your Gemini API key

# Restart
docker-compose restart
```

### 4. Access Your App
Open in browser: `http://YOUR_DROPLET_IP:3001`

---

## Option C: Add SSL & Custom Domain (Extra 10 minutes)

After Option B, run:
```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Create config
cat > /etc/nginx/sites-available/mobile-tech-crm << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable and restart
ln -s /etc/nginx/sites-available/mobile-tech-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d YOUR_DOMAIN.com

# Configure firewall
ufw allow 22,80,443/tcp
ufw enable
```

Done! Access at: `https://YOUR_DOMAIN.com`

---

## Testing

1. Health check:
   ```bash
   curl https://YOUR_URL/api/health
   ```

2. Login:
   - Email: `israel@klugmans.com`
   - Test all features

---

## Updating Your App

```bash
# Local changes
git add .
git commit -m "Update"
git push origin main

# On droplet (if using Option B)
ssh root@YOUR_DROPLET_IP
cd /opt/Mobile-Tech-CRM-Featuring-OCR
git pull
docker-compose down
docker-compose up -d --build
```

On App Platform (Option A): Auto-deploys on push!

---

## Troubleshooting

**View logs:**
```bash
docker-compose logs -f
```

**Restart:**
```bash
docker-compose restart
```

**App not starting:**
- Check `backend/.env` has API_KEY
- Check `backend/serviceAccountKey.json` exists
- Run: `docker-compose logs`

---

## Support

See full docs: [DEPLOYMENT.md](./DEPLOYMENT.md)
