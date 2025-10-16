# AEGIS Deployment Checklist

## Pre-Deployment

### ✅ Environment Setup

- [ ] **Node.js 18+** installed
- [ ] **PostgreSQL 14+** running
- [ ] **Solana CLI** installed
- [ ] **Rust 1.70+** installed (for ZK agent)
- [ ] **Anchor CLI 0.29+** installed

### ✅ Repository Setup

- [ ] Repository cloned
- [ ] All dependencies installed (`npm install` in both `frontend/` and `executor/`)
- [ ] Environment variables configured
- [ ] Database migrations applied

### ✅ Configuration Files

- [ ] **Frontend**: `.env.local` configured
- [ ] **Backend**: `.env` configured
- [ ] **Database**: Connection string verified
- [ ] **Solana**: RPC URL and network set
- [ ] **Executor**: Private key configured

## Backend Deployment

### ✅ Database Setup

```bash
cd executor
npx prisma generate
npx prisma migrate deploy
```

- [ ] Database connection successful
- [ ] All migrations applied
- [ ] Tables created correctly
- [ ] Indexes created

### ✅ Backend Build

```bash
cd executor
npm run build
```

- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] All dependencies resolved
- [ ] Build artifacts created

### ✅ Backend Testing

```bash
cd executor
npm run test
```

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API endpoints respond correctly
- [ ] Database operations work

### ✅ Auto-Restart Configuration

- [ ] **Free Tier**: Auto-restore disabled (saves memory)
- [ ] **Paid Tier**: Auto-restore enabled
- [ ] Dashboard auto-check interval set (default: 30s)
- [ ] Agent monitoring interval set (default: 10s)

## Frontend Deployment

### ✅ Frontend Build

```bash
cd frontend
npm run build
```

- [ ] Next.js build successful
- [ ] Static assets generated
- [ ] No build errors
- [ ] Bundle size optimized

### ✅ Frontend Testing

```bash
cd frontend
npm run test
```

- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] API integration works
- [ ] Wallet connection works

### ✅ Auto-Restart Integration

- [ ] Dashboard auto-restart logic implemented
- [ ] Manual restart button functional
- [ ] SSE connection for real-time updates
- [ ] Error handling for restart failures

## Smart Contracts

### ✅ Program Build

```bash
cd programs/onchain-program
anchor build
```

- [ ] Rust compilation successful
- [ ] Program ID generated
- [ ] IDL file created
- [ ] No compilation errors

### ✅ Program Deployment

```bash
anchor deploy --provider.cluster devnet
```

- [ ] Program deployed to devnet
- [ ] Program ID updated in config
- [ ] Deployment transaction confirmed
- [ ] Program accessible via RPC

## ZK Agent

### ✅ ZK Agent Build

```bash
cd zk-agent
cargo build --release
```

- [ ] Rust compilation successful
- [ ] ZK agent binary created
- [ ] Image ID generated
- [ ] No compilation errors

### ✅ ZK Agent Testing

```bash
cd zk-agent
cargo test
```

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Proof generation works
- [ ] Verification works

## Production Deployment

### ✅ DigitalOcean Deployment

#### App Platform Setup

- [ ] **App Created**: `aegis-private-solana-aiagent-exe`
- [ ] **Source**: Connected to GitHub repository
- [ ] **Branch**: `master` selected
- [ ] **Build Command**: `npm run build`
- [ ] **Run Command**: `npm run start:prod:512mb`

#### Environment Variables

- [ ] `DATABASE_URL`: PostgreSQL connection string
- [ ] `SOLANA_RPC_URL`: Solana RPC endpoint
- [ ] `EXECUTOR_PRIVATE_KEY`: Base58 private key
- [ ] `RELAYER_URL`: Jito relayer endpoint
- [ ] `FRONTEND_URL`: Frontend URL for CORS
- [ ] `NODE_ENV`: `production`

#### Auto-Restart Configuration

- [ ] **Run Command**: `npm run start:prod:512mb`
- [ ] **Health Check**: Port 10000
- [ ] **Auto-Deploy**: Enabled
- [ ] **Scaling**: Configured for expected load

### ✅ Database Setup

#### Neon PostgreSQL

- [ ] **Database Created**: `aegis`
- [ ] **Connection String**: Copied to environment variables
- [ ] **Migrations Applied**: All migrations deployed
- [ ] **Backup Enabled**: Automated backups configured

### ✅ Frontend Deployment

#### Vercel Deployment

- [ ] **Project Connected**: GitHub repository
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `out`
- [ ] **Environment Variables**: Configured

#### Environment Variables

- [ ] `NEXT_PUBLIC_API_URL`: Backend URL
- [ ] `NEXT_PUBLIC_SOLANA_NETWORK`: `devnet`
- [ ] `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC

## Post-Deployment Testing

### ✅ Backend Health Checks

```bash
# Check backend health
curl https://your-backend-url.com/health

# Check database connection
curl https://your-backend-url.com/jobs?walletAddress=test

# Check auto-restart endpoint
curl -X POST https://your-backend-url.com/jobs/restart/123?walletAddress=test
```

- [ ] Backend responds to health checks
- [ ] Database queries work
- [ ] API endpoints accessible
- [ ] Auto-restart endpoint functional

### ✅ Frontend Testing

- [ ] **Landing Page**: Loads correctly
- [ ] **Wallet Connection**: Works with Phantom/Solflare
- [ ] **Dashboard**: Shows user agents
- [ ] **Marketplace**: Can launch agents
- [ ] **Agent Detail**: Shows real-time logs
- [ ] **Auto-Restart**: Detects and restarts stopped agents

### ✅ Agent Functionality

#### Manual Testing

- [ ] **Launch Agent**: Can start continuous agent
- [ ] **Monitor Logs**: Real-time logs via SSE
- [ ] **Pause Agent**: Can pause running agent
- [ ] **Restart Agent**: Can restart paused agent
- [ ] **Delete Agent**: Can remove agent

#### Auto-Restart Testing

- [ ] **Backend Restart**: Agents auto-restart after backend restart
- [ ] **Dashboard Detection**: Dashboard detects stopped agents
- [ ] **Manual Restart**: Manual restart button works
- [ ] **Error Handling**: Graceful handling of restart failures

### ✅ Integration Testing

- [ ] **Wallet Integration**: Solana wallet adapter works
- [ ] **SSE Connection**: Real-time updates work
- [ ] **Database Persistence**: Agent state persists
- [ ] **Transaction Submission**: Jito relayer works
- [ ] **ZK Proof Generation**: ZK agent executes correctly

## Monitoring & Maintenance

### ✅ Logging Setup

- [ ] **Backend Logs**: Structured logging enabled
- [ ] **Frontend Logs**: Console logging configured
- [ ] **Error Tracking**: Error aggregation setup
- [ ] **Performance Monitoring**: Metrics collection

### ✅ Auto-Restart Monitoring

- [ ] **Restart Logs**: All restart events logged
- [ ] **Success Rate**: Track restart success/failure
- [ ] **Performance Impact**: Monitor restart overhead
- [ ] **Alert System**: Notifications for failed restarts

### ✅ Database Monitoring

- [ ] **Connection Pool**: Monitored for leaks
- [ ] **Query Performance**: Slow queries identified
- [ ] **Backup Status**: Automated backups verified
- [ ] **Storage Usage**: Database size monitored

### ✅ Performance Monitoring

- [ ] **Response Times**: API endpoint latency
- [ ] **Memory Usage**: Backend memory consumption
- [ ] **CPU Usage**: Server resource utilization
- [ ] **Error Rates**: 4xx/5xx error tracking

## Security Checklist

### ✅ Authentication

- [ ] **Wallet Signatures**: Message signing works
- [ ] **CORS Configuration**: Proper CORS headers
- [ ] **Rate Limiting**: API rate limits configured
- [ ] **Input Validation**: All inputs validated

### ✅ Data Protection

- [ ] **Database Encryption**: Data encrypted at rest
- [ ] **Connection Security**: TLS/SSL enabled
- [ ] **Private Keys**: Securely stored
- [ ] **API Keys**: Environment variables protected

### ✅ Auto-Restart Security

- [ ] **Authorization**: Only authorized users can restart
- [ ] **Rate Limiting**: Restart requests rate limited
- [ ] **Audit Logging**: All restart actions logged
- [ ] **Error Handling**: No sensitive data in errors

## Rollback Plan

### ✅ Rollback Preparation

- [ ] **Database Backup**: Recent backup available
- [ ] **Code Rollback**: Previous version tagged
- [ ] **Configuration Backup**: Environment variables saved
- [ ] **Rollback Script**: Automated rollback prepared

### ✅ Rollback Testing

- [ ] **Database Rollback**: Tested database restore
- [ ] **Code Rollback**: Tested version downgrade
- [ ] **Configuration Rollback**: Tested env var restore
- [ ] **End-to-End Rollback**: Full rollback tested

## Documentation

### ✅ User Documentation

- [ ] **README.md**: Updated with auto-restart info
- [ ] **API.md**: Auto-restart endpoints documented
- [ ] **AUTO_RESTART_GUIDE.md**: Comprehensive guide created
- [ ] **ARCHITECTURE.md**: Updated with restart flow

### ✅ Developer Documentation

- [ ] **Code Comments**: Auto-restart code documented
- [ ] **API Examples**: Restart endpoint examples
- [ ] **Troubleshooting**: Common issues documented
- [ ] **Performance Notes**: Optimization guidelines

## Final Verification

### ✅ End-to-End Testing

- [ ] **Complete User Flow**: Launch → Monitor → Restart → Pause
- [ ] **Auto-Restart Flow**: Backend restart → Agent detection → Auto-restart
- [ ] **Error Scenarios**: Network failures, database errors
- [ ] **Performance**: Load testing with multiple agents

### ✅ Production Readiness

- [ ] **All Tests Pass**: Unit, integration, e2e tests
- [ ] **Performance Acceptable**: Response times < 2s
- [ ] **Error Rates Low**: < 1% error rate
- [ ] **Monitoring Active**: All metrics being collected

### ✅ Go-Live Checklist

- [ ] **DNS Configured**: Custom domain setup
- [ ] **SSL Certificate**: HTTPS enabled
- [ ] **CDN Setup**: Static assets cached
- [ ] **Backup Verified**: Database backup tested
- [ ] **Team Notified**: All stakeholders informed
- [ ] **Monitoring Alerts**: Alert thresholds set

---

## Quick Commands Reference

### Development

```bash
# Start backend
cd executor && npm run start:dev

# Start frontend
cd frontend && npm run dev

# Run tests
cd executor && npm test
cd frontend && npm test
```

### Production

```bash
# Build backend
cd executor && npm run build

# Build frontend
cd frontend && npm run build

# Deploy to DigitalOcean
# Use the web interface or doctl CLI
```

### Auto-Restart Testing

```bash
# Test restart endpoint
curl -X POST "http://localhost:3001/jobs/restart/123?walletAddress=YOUR_WALLET"

# Check agent status
curl "http://localhost:3001/jobs/status/123?walletAddress=YOUR_WALLET"

# Monitor logs
curl "http://localhost:3001/jobs/stream/123?walletAddress=YOUR_WALLET"
```

---

**Last Updated**: October 16, 2025

For more information, see the [main README](../README.md) and [Auto-Restart Guide](AUTO_RESTART_GUIDE.md).
