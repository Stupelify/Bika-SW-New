# Bika Banquet - VPS Deployment Guide

Complete guide for deploying Bika Banquet to a VPS server.

## Prerequisites

- VPS with Ubuntu 20.04+ (minimum 2GB RAM, 2 CPU cores)
- Domain name pointed to your VPS IP
- SSH access to your server
- Basic knowledge of Linux command line

## Step 1: Server Preparation

### 1.1 Update system packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installations
docker --version
docker-compose --version
```

### 1.3 Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 2: Application Setup

### 2.1 Clone or upload your application

```bash
# Upload your application files to /opt/bika-banquet
sudo mkdir -p /opt/bika-banquet
cd /opt/bika-banquet

# If using git:
# git clone your-repo-url .
```

### 2.2 Configure environment variables

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Required changes in .env:**

```env
# Generate a secure password
DB_PASSWORD=your_secure_database_password_here

# Generate a secure JWT secret (32+ characters)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# Set your domain
CLIENT_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Configure email settings
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### 2.3 Update Nginx configuration

```bash
nano docker/nginx/conf.d/default.conf

# Replace 'yourdomain.com' with your actual domain
# Save and exit (Ctrl+X, Y, Enter)
```

## Step 3: Initial Deployment

### 3.1 Build and start services

```bash
cd /opt/bika-banquet

# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3.2 Database setup

The database migrations run automatically on server startup. To seed initial data:

```bash
# Access the server container
docker exec -it bika-server sh

# Run seed script
npm run seed

# Exit container
exit
```

**Default admin credentials:**
- Email: admin@bikabanquet.com
- Password: admin123

⚠️ **Change these immediately after first login!**

## Step 4: SSL Certificate Setup

### 4.1 Obtain SSL certificate

```bash
# Stop nginx temporarily
docker-compose stop nginx

# Get certificate for your domain
docker-compose run --rm certbot certonly --standalone \
  -d yourdomain.com -d www.yourdomain.com \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email

# Start nginx
docker-compose start nginx
```

### 4.2 Enable HTTPS in Nginx

```bash
nano docker/nginx/conf.d/default.conf

# Uncomment the HTTPS server block (lines starting with #)
# Comment out or remove the temporary HTTP proxy section

# Reload Nginx
docker-compose exec nginx nginx -s reload
```

## Step 5: Verification

### 5.1 Check services

```bash
# All services should be healthy
docker-compose ps

# Test API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000
```

### 5.2 Access application

1. Open https://yourdomain.com in your browser
2. You should see the login page
3. Login with admin credentials
4. Change the default password immediately

## Maintenance Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
```

### Restart services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart server
```

### Update application

```bash
cd /opt/bika-banquet

# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps
```

### Database backup

```bash
# Create backup
docker exec bika-postgres pg_dump -U postgres bika_banquet > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i bika-postgres psql -U postgres bika_banquet < backup_file.sql
```

### Stop application

```bash
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs service-name

# Rebuild specific service
docker-compose up -d --build service-name
```

### Database connection issues

```bash
# Check if database is healthy
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

### SSL certificate renewal fails

```bash
# Renew manually
docker-compose run --rm certbot renew

# Reload nginx
docker-compose exec nginx nginx -s reload
```

### Out of disk space

```bash
# Remove unused Docker resources
docker system prune -a

# Check disk usage
df -h
```

## Security Best Practices

1. **Change default credentials immediately**
2. **Use strong passwords** (16+ characters, mixed case, numbers, symbols)
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Monitor logs regularly**: `docker-compose logs`
5. **Backup database regularly** (daily recommended)
6. **Use SSH keys** instead of password authentication
7. **Enable fail2ban**: `sudo apt install fail2ban`
8. **Set up monitoring** (optional but recommended)

## Performance Optimization

### For production with heavy load:

1. **Increase resources** in docker-compose.yml:
```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

2. **Add Redis caching** (optional)
3. **Set up CDN** for static assets
4. **Enable database connection pooling**
5. **Monitor with tools** like Prometheus/Grafana

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all services are healthy
4. Check firewall rules

## Next Steps

After deployment:
1. Change default admin password
2. Create additional user accounts
3. Configure email settings
4. Set up regular backups
5. Add your data (customers, halls, menus)
6. Test booking workflow
7. Train your team on the system

---

🎉 **Congratulations!** Your Bika Banquet system is now live and ready to manage your banquet operations!
