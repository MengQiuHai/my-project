# Deployment Guide - Growth Bank System

This guide covers deploying the Growth Bank System to production environments.

## 🚀 Pre-deployment Checklist

### System Requirements
- Node.js 16+ with npm 8+
- PostgreSQL 12+ with uuid extension
- Redis 6+ for caching and sessions
- Minimum 2GB RAM, 20GB storage
- SSL certificate for HTTPS

### Environment Setup
1. **Database Setup**
   ```sql
   -- Create production database
   CREATE DATABASE growth_bank_prod;
   CREATE USER growth_bank_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE growth_bank_prod TO growth_bank_user;
   
   -- Enable UUID extension
   \c growth_bank_prod
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Redis Configuration**
   ```bash
   # Install Redis (Ubuntu/Debian)
   sudo apt update
   sudo apt install redis-server
   
   # Configure Redis for production
   sudo nano /etc/redis/redis.conf
   # Set: bind 127.0.0.1
   # Set: requirepass your_redis_password
   
   sudo systemctl restart redis
   ```

## 🔧 Backend Deployment

### 1. Environment Variables
Create production `.env` file:
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://growth_bank_user:secure_password@localhost:5432/growth_bank_prod

# Redis
REDIS_URL=redis://:redis_password@localhost:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/growth-bank/app.log
```

### 2. Build and Deploy
```bash
# Clone repository
git clone <your-repo-url>
cd growth-bank-system/backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start application
npm start
```

### 3. Process Management (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'growth-bank-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/growth-bank/combined.log',
    out_file: '/var/log/growth-bank/out.log',
    error_file: '/var/log/growth-bank/error.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Frontend Deployment

### 1. Build Configuration
Create production `.env.production`:
```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### 2. Build and Deploy
```bash
cd growth-bank-system/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to web server (nginx example)
sudo cp -r build/* /var/www/growth-bank/
```

## 🔒 Reverse Proxy Setup (Nginx)

### Backend Proxy
```nginx
# /etc/nginx/sites-available/growth-bank-api
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Frontend Proxy
```nginx
# /etc/nginx/sites-available/growth-bank-frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    root /var/www/growth-bank;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
}
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Performance monitoring
clinic doctor -- node dist/index.js
clinic bubbleprof -- node dist/index.js
```

### 2. Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/growth-bank

# Content:
/var/log/growth-bank/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Health Monitoring
```bash
# Add to crontab for regular health checks
crontab -e

# Add line:
*/5 * * * * cd /path/to/growth-bank-system/backend && npm run health:check >> /var/log/growth-bank/health.log 2>&1
```

## 🔐 Security Considerations

### 1. Database Security
- Use strong passwords
- Enable SSL for database connections
- Regular backups with encryption
- Restrict database access to application server only

### 2. Application Security
- Keep dependencies updated
- Use HTTPS everywhere
- Implement proper CORS policies
- Rate limiting for API endpoints
- Input validation and sanitization

### 3. Server Security
- Regular OS updates
- Firewall configuration
- SSH key-based authentication
- Regular security audits

## 📈 Performance Optimization

### 1. Database Optimization
```bash
# Run performance analysis
npm run performance:analyze

# Optimize PostgreSQL configuration
sudo nano /etc/postgresql/13/main/postgresql.conf

# Key settings:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### 2. Application Optimization
- Enable compression in nginx
- Use CDN for static assets
- Implement Redis caching
- Database connection pooling
- Code splitting in frontend

## 🔄 Backup Strategy

### 1. Database Backup
```bash
#!/bin/bash
# /usr/local/bin/backup-growth-bank.sh

BACKUP_DIR="/var/backups/growth-bank"
DB_NAME="growth_bank_prod"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Add to crontab:
# 0 2 * * * /usr/local/bin/backup-growth-bank.sh
```

### 2. File Backup
```bash
# Backup application files and user data
rsync -av /path/to/growth-bank-system/ /backup/location/
```

## 🚨 Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks with `clinic doctor`
   - Increase Node.js heap size: `--max_old_space_size=2048`
   - Monitor with `pm2 monit`

2. **Database Connection Issues**
   - Check connection pool settings
   - Verify database credentials
   - Monitor connection count

3. **Performance Issues**
   - Run `npm run performance:analyze`
   - Check database query performance
   - Verify Redis is working

### Log Analysis
```bash
# Check application logs
pm2 logs growth-bank-backend

# Check nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Check system resources
htop
iostat -x 1
```

## 📱 Mobile Deployment (Optional)

If you plan to create mobile apps:

### React Native Setup
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Create mobile app
npx react-native init GrowthBankMobile
```

### Expo Setup
```bash
# Install Expo CLI
npm install -g @expo/cli

# Create Expo project
npx create-expo-app GrowthBankMobile
```

## 🎯 Post-Deployment

1. **Verify deployment**
   ```bash
   npm run health:check
   ```

2. **Performance testing**
   ```bash
   npm run performance:analyze
   ```

3. **Security scan**
   ```bash
   npm audit
   npm run lint
   ```

4. **Monitor for 24-48 hours**
   - Check logs for errors
   - Monitor performance metrics
   - Verify all features work correctly

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs`
2. Run health check: `npm run health:check`
3. Check system resources: `htop`, `df -h`
4. Review this deployment guide
5. Check GitHub issues for similar problems

Remember to customize all passwords, domains, and paths according to your specific deployment environment!