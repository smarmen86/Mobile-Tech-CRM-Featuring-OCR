# Deploying Mobile Tech CRM to DigitalOcean

This guide covers deploying the Mobile Tech CRM application to DigitalOcean using Docker.

## Prerequisites

1. DigitalOcean account
2. Docker installed locally (for testing)
3. Your Firebase service account key (`serviceAccountKey.json`)
4. Your Gemini API key

## Deployment Options

### Option 1: DigitalOcean App Platform (Recommended - Easiest)

1. **Push your code to GitHub** (if not already done)

2. **Create a new App in DigitalOcean:**
   - Go to DigitalOcean Dashboard → Apps → Create App
   - Connect your GitHub repository: `smarmen86/Mobile-Tech-CRM-Featuring-OCR`
   - Select the `main` branch

3. **Configure the App:**
   - **Name:** `mobile-tech-crm`
   - **Region:** Choose closest to your users
   - **Type:** Dockerfile
   - **Dockerfile Path:** `Dockerfile`
   - **HTTP Port:** `3001`

4. **Set Environment Variables:**
   Go to App Settings → Environment Variables and add:
   ```
   NODE_ENV=production
   PORT=3001
   API_KEY=<your-gemini-api-key>
   ```

5. **Add Firebase Credentials:**
   - Encode your `serviceAccountKey.json` to base64:
     ```bash
     cat backend/serviceAccountKey.json | base64 -w 0
     ```
   - Add as environment variable:
     ```
     FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-content>
     ```
   - Update `backend/server.js` to decode and use this (see modification below)

6. **Deploy:**
   - Click "Create Resources"
   - App Platform will build and deploy automatically
   - You'll get a URL like: `https://mobile-tech-crm-xxxxx.ondigitalocean.app`

---

### Option 2: DigitalOcean Droplet with Docker

#### Step 1: Create a Droplet

1. Go to DigitalOcean → Droplets → Create Droplet
2. Choose:
   - **Image:** Ubuntu 24.04 LTS
   - **Plan:** Basic ($6/month 1GB RAM minimum)
   - **Datacenter:** Closest to your users
   - **Add SSH keys** (recommended)
3. Create Droplet

#### Step 2: Setup the Server

SSH into your droplet:
```bash
ssh root@your-droplet-ip
```

Install Docker:
```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

#### Step 3: Deploy the Application

Clone your repository:
```bash
cd /opt
git clone https://github.com/smarmen86/Mobile-Tech-CRM-Featuring-OCR.git
cd Mobile-Tech-CRM-Featuring-OCR
```

Create environment file:
```bash
cat > backend/.env << 'EOF'
API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=3001
EOF
```

Add your Firebase service account key:
```bash
# Upload serviceAccountKey.json to /opt/Mobile-Tech-CRM-Featuring-OCR/backend/
# You can use scp from your local machine:
# scp backend/serviceAccountKey.json root@your-droplet-ip:/opt/Mobile-Tech-CRM-Featuring-OCR/backend/
```

Build and run with Docker Compose:
```bash
docker-compose up -d --build
```

Check logs:
```bash
docker-compose logs -f
```

#### Step 4: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### Step 5: Setup Nginx Reverse Proxy (Optional but Recommended)

Install Nginx:
```bash
apt install nginx -y
```

Create Nginx configuration:
```bash
cat > /etc/nginx/sites-available/mobile-tech-crm << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/mobile-tech-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 6: Setup SSL with Let's Encrypt (Optional)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

---

## Testing the Deployment

1. **Check if the app is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","dbMode":"FIRESTORE","cacheSize":0}`

2. **Access from browser:**
   - Direct: `http://your-droplet-ip:3001`
   - With Nginx: `http://your-domain.com`
   - With SSL: `https://your-domain.com`

3. **Test login:**
   - Email: `israel@klugmans.com`
   - Navigate through the app

---

## Updating the Application

### On App Platform:
```bash
git add .
git commit -m "Update application"
git push origin main
```
DigitalOcean will auto-deploy.

### On Droplet:
```bash
cd /opt/Mobile-Tech-CRM-Featuring-OCR
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## Monitoring and Maintenance

### View logs:
```bash
docker-compose logs -f
```

### Restart the app:
```bash
docker-compose restart
```

### Stop the app:
```bash
docker-compose down
```

### Backup Firestore data:
Firestore data is in Google Cloud. Use Firebase Console for backups.

---

## Troubleshooting

### App won't start:
```bash
docker-compose logs
```
Check for missing environment variables or Firebase credentials.

### Can't connect to Firebase:
- Verify `serviceAccountKey.json` is correct
- Check that the service account has Firestore permissions

### Port already in use:
```bash
docker-compose down
lsof -i :3001
kill -9 <PID>
```

### Out of memory:
Upgrade to a larger droplet (at least 2GB RAM recommended).

---

## Security Recommendations

1. **Never commit sensitive files:**
   - `.env` files
   - `serviceAccountKey.json`
   - Add them to `.gitignore`

2. **Use environment variables** for all secrets

3. **Keep Docker images updated:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **Enable automatic security updates:**
   ```bash
   apt install unattended-upgrades -y
   dpkg-reconfigure -plow unattended-upgrades
   ```

5. **Regular backups** of your Firestore data

---

## Cost Estimate (DigitalOcean)

- **App Platform:** ~$12/month (includes auto-scaling, SSL, monitoring)
- **Droplet + Nginx:** ~$6-12/month (manual setup, more control)
- **Firestore:** Free tier (1GB storage, 50K reads/day) or ~$0.18/GB/month

---

## Support

For issues or questions, check:
- Backend logs: `docker-compose logs backend`
- DigitalOcean status: https://status.digitalocean.com/
- Firebase status: https://status.firebase.google.com/

---

**Next Steps:**
1. Choose deployment method (App Platform recommended for beginners)
2. Prepare your environment variables and credentials
3. Follow the deployment steps above
4. Test thoroughly before going live
