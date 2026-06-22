# Shop-Edoo Deployment Guide

Complete guide for deploying Shop-Edoo to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB Atlas cluster created and secured
- [ ] Stripe account with test and production keys
- [ ] HTTPS enabled for all domains
- [ ] API rate limiting implemented
- [ ] Security headers configured
- [ ] Error logging configured
- [ ] Database backups configured
- [ ] CDN setup for static assets

## Backend Deployment

### Option 1: Render.com (Recommended for Node.js)

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Create Render Service**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose "Node"

3. **Configure Environment**
   - **Name**: shop-edoo-api
   - **Region**: Select closest to your users
   - **Branch**: main
   - **Build Command**: `pnpm install && pnpm run build:backend`
   - **Start Command**: `node backend/server.js`

4. **Add Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopedoo
   JWT_SECRET=your_production_secret_key
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Render will auto-deploy on git push
   - Monitor logs in dashboard
   - Your API will be at: `https://shop-edoo-api.onrender.com`

### Option 2: Railway.app

1. Create account at https://railway.app
2. Connect GitHub repository
3. Add MongoDB plugin
4. Configure environment variables
5. Deploy service

### Option 3: AWS/DigitalOcean

1. Create Ubuntu VM
2. Install Node.js and PM2
3. Configure reverse proxy (Nginx)
4. Set up SSL with Let's Encrypt
5. Configure MongoDB connection
6. Deploy with PM2

## Frontend Deployment

### Vercel (Easiest for Next.js)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Vercel Project**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Select "Next.js" framework

3. **Configure Environment Variables**
   - **NEXT_PUBLIC_API_URL**: `https://your-api-domain.com/api`

4. **Deploy**
   - Vercel auto-deploys on git push
   - Your site will be at: `https://shop-edoo.vercel.app`

### Custom Domain Setup (Vercel)

1. In Vercel project settings → Domains
2. Add your custom domain (e.g., shopedoo.com)
3. Update DNS records:
   ```
   CNAME: www.shopedoo.com → cname.vercel-dns.com
   A record: 76.76.19.132
   ```
4. Verify domain
5. Auto-HTTPS certificate will be issued

## Database Configuration

### MongoDB Atlas Setup

1. **Create Cluster**
   - Go to https://cloud.mongodb.com
   - Click "Create Cluster"
   - Choose "Shared" tier (free)
   - Select region closest to backend
   - Create cluster

2. **Security Configuration**
   - Network Access → Add IP Address
   - Add production IP (or 0.0.0.0/0 for development)
   - Create database user with strong password

3. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/shopedoo?retryWrites=true&w=majority
   ```

4. **Backup Configuration**
   - Enable automated backups
   - Set backup frequency (daily recommended)
   - Test restore procedures

## Payment Integration

### Stripe Production Keys

1. **Upgrade to Production**
   - Go to https://dashboard.stripe.com
   - Account Settings → Test/Live Mode
   - Switch to Live Mode
   - Verify business information

2. **Get API Keys**
   - Developers → API Keys
   - Copy Publishable and Secret keys
   - Add to environment variables

3. **Configure Webhooks**
   - Developers → Webhooks
   - Add Endpoint URL: `https://api.shopedoo.com/api/payment/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy Signing Secret to STRIPE_WEBHOOK_SECRET

4. **Test Payments**
   - Use test card: 4242 4242 4242 4242
   - Verify payments appear in dashboard
   - Test webhook handling

## Security Configuration

### HTTPS/SSL

- Automatic with Vercel and Render
- Enable HSTS headers
- Redirect HTTP to HTTPS

### CORS Configuration

Update backend `server.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Rate Limiting

Add to backend (install express-rate-limit):
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use('/api/', limiter);
```

### Security Headers

Add to backend:
```typescript
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb' }));
```

## Monitoring & Logging

### Error Tracking (Sentry)

1. Create account at https://sentry.io
2. Create project for backend
3. Add Sentry SDK:
   ```bash
   npm install @sentry/node
   ```
4. Initialize in `server.ts`:
   ```typescript
   import * as Sentry from "@sentry/node";
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   ```

### Database Monitoring

- MongoDB Atlas built-in monitoring
- Set up alerts for:
  - High CPU usage
  - Connection count spikes
  - Slow queries

### API Monitoring

- Implement request logging
- Monitor response times
- Track error rates
- Use APM service (New Relic, DataDog)

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run build:backend
      - run: pnpm run lint
      # Add deployment step here
```

## Performance Optimization

### Frontend
- Enable Next.js Image Optimization
- Configure ISR (Incremental Static Regeneration)
- Implement code splitting
- Use compression middleware

### Backend
- Enable database query indexing
- Implement caching (Redis)
- Use connection pooling
- Optimize database queries

### CDN Configuration
- Serve static assets from CDN
- Cache aggressive headers
- Minify CSS/JS

## Database Backup & Recovery

### Automated Backups
- MongoDB Atlas: Daily snapshots (built-in)
- Retention: Keep last 30 days
- Test restore procedures weekly

### Manual Backup
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/shopedoo"
tar -czvf backup-$(date +%Y%m%d).tar.gz dump/
```

### Recovery Procedure
```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/shopedoo" ./dump
```

## Scaling Considerations

### Phase 1 (0-1000 users)
- Shared MongoDB cluster
- Single backend instance
- Vercel free tier frontend

### Phase 2 (1000-10000 users)
- Dedicated MongoDB cluster
- Load balanced backend (2-3 instances)
- Upgrade Vercel to pro

### Phase 3 (10000+ users)
- Database sharding
- Multiple backend clusters
- Global CDN
- Kubernetes deployment

## Troubleshooting Production Issues

### Backend Issues
```bash
# Check logs
vercel logs

# SSH into server
vercel ssh

# Monitor performance
htop
```

### Database Issues
```bash
# Check connections
mongosh your-connection-string

# Query performance
db.collection.explain("executionStats").find({})
```

### Payment Issues
- Check Stripe dashboard for failed payments
- Verify webhook endpoint is responding
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/payment/webhook`

## Rollback Procedure

### Frontend
- Vercel automatically keeps previous deployments
- Click "Deployments" → Select previous → "Promote to Production"

### Backend
- Keep git history with tagged releases
- Use blue-green deployment strategy
- Maintain connection to previous database version

## Maintenance Windows

- Schedule monthly maintenance windows
- Update dependencies quarterly
- Review security logs monthly
- Test disaster recovery procedures quarterly

## Health Checks

Implement health endpoints:

**Backend**:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});
```

**Monitor with**:
```
https://www.healthchecks.io
```

## Support & SLA

- Response time: 1 hour
- Resolution time: 4 hours
- Uptime target: 99.9%
- Maintenance window: 2-4 AM UTC, first Sunday of month

---

**Production Deployment Checklist:**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] SSL certificates issued
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Stripe webhooks verified
- [ ] DNS records updated
- [ ] Smoke tests completed
- [ ] Team notified of deployment
