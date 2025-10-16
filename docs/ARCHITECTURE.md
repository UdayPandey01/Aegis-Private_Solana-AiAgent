# AEGIS Architecture Documentation

## System Overview

AEGIS is a decentralized platform for deploying autonomous AI agents on Solana with zero-knowledge proof verification.

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         User Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   Browser   │  │   Wallet    │  │    CLI      │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
└─────────┼─────────────────┼─────────────────┼─────────────────────┘
          │                 │                 │
┌─────────┴─────────────────┴─────────────────┴─────────────────────┐
│                    Presentation Layer                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Next.js Frontend (Port 3000)                 │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐   │    │
│  │  │Dashboard│  │Marketplace│  │  Vault  │  │ Agents  │   │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └──────────┘   │    │
│  └───────────────────┬──────────────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────────┘
                        │ HTTP/SSE
┌────────────────────────┴──────────────────────────────────────────┐
│                    Application Layer                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │            NestJS Backend (Port 3001)                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │Jobs Svc  │  │SSE Svc   │  │Price Svc │  │Auth Svc │ │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┘ │    │
│  │  ┌────┴──────────────┴─────────────┴─────────────────┐  │    │
│  │  │            Solana Service Layer                    │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐              │  │    │
│  │  │  │ Transaction  │  │   Relayer    │              │  │    │
│  │  │  │   Builder    │  │   Service    │              │  │    │
│  │  │  └──────────────┘  └──────────────┘              │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └───────┬──────────────┬────────────────────┬──────────────┘    │
└──────────┼──────────────┼────────────────────┼───────────────────┘
           │              │                    │
┌──────────┴──────┐  ┌────┴────────┐  ┌────────┴───────────────────┐
│   Data Layer    │  │ Proof Layer │  │     Blockchain Layer       │
│  ┌───────────┐  │  │┌──────────┐ │  │  ┌──────────────────────┐ │
│  │PostgreSQL │  │  ││ZK Agent  │ │  │  │  Solana Blockchain   │ │
│  │ (Prisma)  │  │  ││(RISC Zero)│ │  │  │   ┌──────────────┐  │ │
│  └───────────┘  │  │└──────────┘ │  │  │   │Smart Contracts│ │ │
└─────────────────┘  └─────────────┘  │  │   │   (Anchor)    │ │ │
                                      │  │   └──────────────┘  │ │
                                      │  └──────────────────────┘ │
                                      └────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

#### Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Solana Wallet Adapter**: Multi-wallet support

#### Key Components

**Dashboard**

- Displays all user agents
- Shows aggregate metrics (P&L, trades)
- Auto-refreshes every 5 seconds
- Filters by status (RUNNING, PAUSED, COMPLETED)

**Marketplace**

- Lists available agent templates
- Configuration interface
- Launch agent functionality
- Parameter customization

**Agent Detail**

- Real-time execution logs via SSE
- Performance charts
- Pause/Resume controls
- Transaction history

**Vault**

- Balance display
- Deposit/Withdraw interface
- Transaction history
- Multi-signature support (planned)

### 2. Backend Layer

#### Tech Stack

- **NestJS**: Scalable Node.js framework
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Relational database
- **Anchor**: Solana SDK
- **Axios**: HTTP client

#### Services

**Jobs Service** (`jobs.service.ts`)

```typescript
Responsibilities:
- Agent lifecycle management
- Continuous monitoring loops
- Trade execution coordination
- Database persistence
- SSE event emission
- Auto-restart functionality
- Agent status monitoring
```

**SSE Service** (`sse.service.ts`)

```typescript
Responsibilities:
- Client connection management
- Event broadcasting
- Keep-alive heartbeats
- Connection cleanup
```

**Solana Service** (`solana.service.ts`)

```typescript
Responsibilities:
- Transaction building
- Account management
- Balance checking
- Signature verification
```

**Relayer Service** (`relayer.service.ts`)

```typescript
Responsibilities:
- Jito bundle submission
- RPC fallback
- Transaction confirmation
- Error handling
```

**Price Logger Service** (`price-logger.service.ts`)

```typescript
Responsibilities:
- DEX price fetching
- Arbitrage detection
- Market analysis
- Rate limiting
```

### 3. Data Layer

#### Database Schema

```prisma
model User {
  id              String   @id @default(uuid())
  walletAddress   String   @unique
  totalPnL        Float    @default(0)
  tradesExecuted  Int      @default(0)
  createdAt       DateTime @default(now())
  jobs            Job[]
}

model Job {
  id                Int      @id @default(autoincrement())
  jobId             BigInt   @unique
  status            String   @default("PENDING")
  agentType         String
  result            String?
  parameters        String?  @default("{\"profitThreshold\":0.5}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userWalletAddress], references: [walletAddress])
  userWalletAddress String
}
```

### 4. Proof Layer

#### ZK Agent Architecture

```
┌─────────────────────────────────────────────┐
│           Host Program (executor)            │
│  ┌────────────────────────────────────────┐ │
│  │  1. Prepare inputs                     │ │
│  │  2. Invoke guest program               │ │
│  │  3. Receive receipt                    │ │
│  │  4. Verify proof                       │ │
│  │  5. Extract journal (results)          │ │
│  └────────────────────────────────────────┘ │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│        Guest Program (ZK environment)        │
│  ┌────────────────────────────────────────┐ │
│  │  1. Receive market data                │ │
│  │  2. Analyze arbitrage opportunities    │ │
│  │  3. Calculate optimal routes           │ │
│  │  4. Generate execution plan            │ │
│  │  5. Commit results to journal          │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 5. Blockchain Layer

#### Smart Contract Architecture

```rust
Program: onchain_program

Instructions:
  - create_job(job_id: u64)
  - execute_job(result: Vec<u8>)

Accounts:
  - Job PDA: [b"job", authority, job_id]

State:
  pub struct Job {
      pub authority: Pubkey,
      pub job_id: u64,
      pub result: Vec<u8>,
      pub created_at: i64,
  }
```

## Data Flow

### Agent Lifecycle

```
1. User Launches Agent
   └─> Frontend: POST /jobs/start-continuous
       └─> Backend: Create job in DB
           └─> Start continuous loop
               └─> Emit SSE event

2. Agent Monitoring Loop
   └─> Every 10 seconds:
       ├─> Fetch DEX prices
       ├─> Invoke ZK agent
       ├─> Analyze opportunities
       └─> If opportunity found:
           ├─> Build transaction
           ├─> Submit to Jito
           ├─> Confirm on-chain
           ├─> Update DB (P&L, trades)
           └─> Emit SSE event

3. Auto-Restart Detection
   └─> Dashboard: Check every 30 seconds
       ├─> Query agent status
       ├─> If marked RUNNING but not running:
       │   └─> POST /jobs/restart/:jobId
       │       └─> Backend: Restart agent
       │           └─> Emit restart log
       └─> Continue monitoring

4. User Views Agent
   └─> Frontend: Connect SSE stream
       └─> Receive initial logs from DB
           └─> Receive real-time updates
               └─> Display in UI
```

### Transaction Flow

```
1. Opportunity Detected
   └─> Backend: Build create + execute job tx
       ├─> Create job instruction
       ├─> Execute job instruction (ZK proof)
       └─> Serialize to base58

2. Submit Transaction
   └─> Try Jito relayer endpoints
       ├─> Dallas
       ├─> NY
       └─> If all fail:
           └─> Fallback to Solana RPC
               ├─> Convert base58 -> base64
               └─> Wait for confirmation

3. Confirmation
   └─> Poll getSignatureStatuses
       ├─> Check every 2 seconds
       ├─> Max 30 attempts (60s timeout)
       └─> Return signature or error
```

## Communication Protocols

### REST API

**Request/Response Pattern**

```
Client → POST /jobs/start-continuous → Server
Client ← 202 Accepted ← Server
```

### Server-Sent Events (SSE)

**Streaming Pattern**

```
Client → GET /jobs/stream/31 → Server
Client ← event: connected ← Server
Client ← event: log_update ← Server (continuous)
Client ← event: job_update ← Server (on status change)
```

**Event Types:**

- `connected`: Initial connection
- `log_update`: New execution logs
- `job_update`: Status/result changed
- `chart_update`: Performance metrics
- `ping`: Keep-alive heartbeat

### WebSocket (Future)

Planned for bidirectional communication:

- Agent commands
- Real-time chat
- Multi-user collaboration

## Security Architecture

### Authentication & Authorization

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Wallet  │────────>│ Frontend │────────>│ Backend  │
└──────────┘         └──────────┘         └──────────┘
     │                     │                     │
     │ Sign Message        │ Verify Signature    │
     │<────────────────────┤<────────────────────│
     │                     │                     │
     └────────────────────>│ Include in Requests │
                           │────────────────────>│
```

### ZK Proof Verification

```
1. Off-chain Computation
   └─> Guest program executes
       └─> Generates proof + journal

2. Proof Verification
   └─> Host verifies against image ID
       └─> Extracts journal data

3. On-chain Storage
   └─> Store hash/result in smart contract
       └─> Permanent audit trail
```

## Scalability Considerations

### Horizontal Scaling

**Backend Instances**

- Stateless NestJS services
- Load balancer distribution
- Shared PostgreSQL database
- Redis for session management (planned)

**Database Optimization**

- Connection pooling
- Read replicas for queries
- Write master for updates
- Indexed columns (walletAddress, jobId)

### Performance Optimization

**Frontend**

- Server-side rendering (SSR)
- Static generation where possible
- Code splitting
- Image optimization
- Lazy loading components

**Backend**

- Async/await throughout
- Worker threads for heavy computation
- Batch database operations
- Connection pooling
- Rate limiting

### Monitoring & Observability

**Metrics** (Planned)

- Request latency
- Error rates
- Agent success rates
- Transaction confirmation times
- Database query performance

**Logging**

- Structured logging (JSON)
- Log levels (debug, info, warn, error)
- Distributed tracing
- Error aggregation

## Deployment Architecture

### Development

```
Local Machine
├── PostgreSQL (localhost:5432)
├── Backend (localhost:3001)
└── Frontend (localhost:3000)
```

### Production (Recommended)

```
Cloud Provider (AWS/GCP/Azure)
├── Load Balancer
├── Frontend (Vercel/Netlify)
├── Backend (ECS/Kubernetes)
│   ├── Instance 1
│   ├── Instance 2
│   └── Instance N
├── Database (RDS/Cloud SQL)
├── Cache (Redis/ElastiCache)
└── Monitoring (CloudWatch/Datadog)
```

## Technology Decisions

### Why Next.js?

- Server-side rendering for SEO
- Built-in routing
- API routes for BFF pattern
- Great developer experience
- Large ecosystem

### Why NestJS?

- TypeScript-first
- Modular architecture
- Dependency injection
- Built-in testing support
- Excellent documentation

### Why PostgreSQL?

- ACID compliance
- Complex queries
- JSON support
- Mature ecosystem
- Excellent Prisma support

### Why Solana?

- High throughput
- Low transaction costs
- Fast finality
- Strong ecosystem
- ZK-friendly

### Why RISC Zero?

- Production-ready
- Rust-based
- Flexible
- Good documentation
- Active development

## Future Enhancements

### Planned Features

1. **Multi-signature Vaults**

   - Shared ownership
   - Approval workflows
   - Enhanced security

2. **Advanced Strategies**

   - Custom strategy builder
   - Backtesting
   - Strategy marketplace

3. **Social Features**

   - Public profiles
   - Strategy sharing
   - Leaderboards

4. **Mobile App**

   - iOS/Android
   - Push notifications
   - Mobile wallet support

5. **Analytics Dashboard**
   - Advanced charts
   - Performance attribution
   - Risk metrics

---

**Last Updated**: October 12, 2025

For more information, see the [main README](../README.md).
