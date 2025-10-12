# AEGIS - Private Solana AI Agent Platform

<div align="center">

![AEGIS Logo](https://img.shields.io/badge/AEGIS-Private%20AI%20Agents-blue?style=for-the-badge)

**Zero-Knowledge Proof-Powered Autonomous Trading Agents on Solana**

[![Solana](https://img.shields.io/badge/Solana-Devnet-green?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-red?logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**AEGIS** is a next-generation decentralized platform that enables users to deploy autonomous AI agents for arbitrage trading on the Solana blockchain. The platform leverages **Zero-Knowledge Proofs (ZK)** to ensure privacy and verifiability of agent computations while maintaining transparency and trust.

### What Makes AEGIS Unique?

- **🔐 Privacy-First**: ZK proofs ensure your trading strategies remain confidential
- **🤖 Autonomous Agents**: Deploy and forget - agents continuously monitor and execute trades
- **⚡ Real-Time Updates**: Server-Sent Events (SSE) for live trade execution logs
- **💰 Vault Management**: Secure fund management with multi-signature capabilities
- **📊 Performance Analytics**: Track P&L, trades executed, and agent performance metrics

---

## ✨ Key Features

### 🔄 Continuous Arbitrage Agents

- **Automated Market Scanning**: Monitors Orca, Raydium, and Jupiter DEXes for opportunities
- **Configurable Thresholds**: Set custom profit thresholds for trade execution
- **Multi-Agent Support**: Run multiple agents simultaneously with different strategies
- **Auto-Restart**: Agents automatically resume after backend restarts

### 🔒 Zero-Knowledge Proofs

- **Private Computation**: Execute trades without revealing strategies
- **Verifiable Results**: On-chain proof of correct execution
- **RISC Zero Integration**: Industry-leading ZK proof generation

### 💳 Vault System

- **Secure Fund Storage**: Non-custodial vault for trading capital
- **Balance Tracking**: Real-time vault balance monitoring
- **Transaction History**: Complete audit trail of all operations

### 📈 Real-Time Dashboard

- **Live Agent Monitoring**: View all active, paused, and completed agents
- **Performance Metrics**: Total P&L, trades executed, win rate, and more
- **Execution Logs**: Detailed logs with timestamps and transaction links
- **Interactive Charts**: Visualize performance over time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dashboard  │  │ Marketplace │  │    Vault    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + SSE
┌────────────────────────┴────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Jobs Service │  │ SSE Service  │  │ Solana Svc   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────┬─────────────────┬─────────────┘
             │                │                 │
    ┌────────┴────────┐  ┌────┴────┐  ┌────────┴────────┐
    │  ZK Agent Host  │  │PostgreSQL│  │ Solana Network  │
    │   (RISC Zero)   │  │ (Prisma) │  │    (Devnet)     │
    └─────────────────┘  └──────────┘  └─────────────────┘
```

### Component Overview

#### Frontend (`/frontend`)

- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Multi-wallet support
- **Recharts**: Performance visualization
- **Server-Sent Events**: Real-time log updates

#### Backend (`/executor`)

- **NestJS**: Scalable Node.js framework
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database for agent state
- **Anchor**: Solana program interaction
- **Jito Relayer**: MEV-protected transaction submission

#### Smart Contracts (`/programs`)

- **Anchor Framework**: Solana program development
- **Job Management**: On-chain job creation and execution
- **ZK Verification**: On-chain proof verification

#### ZK Agent (`/zk-agent`)

- **RISC Zero**: Zero-knowledge proof generation
- **Rust**: High-performance computation
- **Price Analysis**: Off-chain arbitrage detection

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **@solana/wallet-adapter** - Wallet integration
- **Axios** - HTTP client
- **Recharts** - Data visualization

### Backend

- **NestJS** - Server framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **@coral-xyz/anchor** - Solana SDK
- **@solana/web3.js** - Solana client
- **Axios** - HTTP client
- **bs58** - Base58 encoding

### Blockchain

- **Solana** - Layer 1 blockchain
- **Anchor** - Smart contract framework
- **Jito** - MEV protection
- **Orca/Raydium** - DEX integrations

### DevOps

- **Docker** - Containerization
- **Node.js 18+** - Runtime
- **pnpm/npm** - Package management

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **pnpm** or **yarn**
- **PostgreSQL** >= 14
- **Solana CLI** (for program deployment)
- **Rust** >= 1.70 (for ZK agent compilation)
- **Anchor CLI** >= 0.29.0 (for smart contracts)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/aegis-private-solana-aiagent.git
cd aegis-private-solana-aiagent
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install Backend Dependencies

```bash
cd executor
npm install
cd ..
```

### 4. Set Up Database

```bash
cd executor

npx prisma generate

npx prisma migrate dev --name init
```

### 5. Build ZK Agent (Optional)

```bash
cd zk-agent
cargo build --release
cd ..
```

### 6. Deploy Smart Contracts (Optional)

```bash
cd programs/onchain-program
anchor build
anchor deploy --provider.cluster devnet
cd ../..
```

---

## ⚙️ Configuration

### Environment Variables

#### Frontend (`.env.local`)

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

#### Backend (`.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aegis?schema=public"

SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY

EXECUTOR_PRIVATE_KEY=your_base58_private_key_here

PORT=3001

RELAYER_URL=https://dallas.testnet.block-engine.jito.wtf/api/v1/bundles
```

### Configure Executor Wallet

1. Generate a new Solana keypair or use existing one:

```bash
solana-keygen new -o executor-keypair.json
```

2. Get the private key in base58 format:

```bash
solana-keygen pubkey executor-keypair.json
```

3. Airdrop SOL for devnet testing:

```bash
solana airdrop 2 YOUR_EXECUTOR_PUBLIC_KEY --url devnet
```

4. Add the private key to `.env`:

```env
EXECUTOR_PRIVATE_KEY=your_base58_private_key
```

---

## 🎮 Usage

### Start the Backend

```bash
cd executor
npm run start:dev
```

Backend will be available at `http://localhost:3001`

### Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Access the Application

1. Open `http://localhost:3000` in your browser
2. Connect your Solana wallet (Phantom, Solflare, etc.)
3. Navigate to **Marketplace** to launch agents
4. Configure agent parameters (profit threshold, etc.)
5. Click **Launch Agent** to start monitoring
6. View agent status in **Dashboard**
7. Monitor real-time logs in agent detail page

---

## 📁 Project Structure

```
aegis-private-solana-aiagent/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # App router pages
│   │   ├── app/               # Main application pages
│   │   │   ├── dashboard/    # Dashboard page
│   │   │   ├── marketplace/  # Agent marketplace
│   │   │   ├── vault/        # Vault management
│   │   │   └── agent/        # Agent detail page
│   │   ├── page.tsx          # Landing page
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   │   ├── landing/          # Landing page components
│   │   └── ui/               # UI components
│   ├── hooks/                # Custom React hooks
│   │   ├── useSSE.ts        # SSE connection hook
│   │   └── useVaultBalance.ts # Vault balance hook
│   └── public/               # Static assets
│
├── executor/                   # NestJS backend application
│   ├── src/
│   │   ├── agent/            # ZK agent integration
│   │   ├── jobs/             # Job management & processing
│   │   ├── solana/           # Solana blockchain interaction
│   │   │   ├── solana.service.ts  # Transaction building
│   │   │   └── relayer.service.ts # Jito relayer & RPC
│   │   ├── sse/              # Server-Sent Events
│   │   ├── price/            # DEX price fetching
│   │   └── prisma/           # Database client
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   └── package.json
│
├── programs/                   # Solana smart contracts
│   └── onchain-program/
│       ├── programs/
│       │   └── onchain-program/
│       │       └── src/
│       │           └── lib.rs # Anchor program
│       └── Anchor.toml
│
├── zk-agent/                  # Zero-knowledge proof agent
│   ├── host/                 # Host program (executor)
│   ├── methods/              # ZK guest programs
│   └── core/                 # Shared utilities
│
└── README.md                  # This file
```

---

## 🔌 API Documentation

### REST Endpoints

#### Jobs

**Create Job (One-Shot)**

```http
POST /jobs
Content-Type: application/json

{
  "jobId": 1760254134636,
  "userWalletAddress": "9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t",
  "parameters": {
    "profitThreshold": 0.5
  }
}
```

**Start Continuous Agent**

```http
POST /jobs/start-continuous
Content-Type: application/json

{
  "jobId": 1760254134636,
  "userWalletAddress": "9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t",
  "parameters": {
    "profitThreshold": 0.5
  }
}
```

**Pause Agent**

```http
POST /jobs/pause/:jobId?walletAddress=YOUR_WALLET
```

**Get Agent Status**

```http
GET /jobs/status/:jobId?walletAddress=YOUR_WALLET
```

**Get All Jobs**

```http
GET /jobs?walletAddress=YOUR_WALLET
```

**Get Execution Logs**

```http
GET /jobs/execution-logs?walletAddress=YOUR_WALLET&jobId=31
```

#### SSE Stream

**Connect to Real-Time Updates**

```http
GET /jobs/stream/:jobId?walletAddress=YOUR_WALLET
```

SSE Event Types:

- `connected` - Initial connection established
- `job_update` - Job status changed
- `log_update` - New execution logs
- `chart_update` - Performance metrics updated
- `ping` - Keep-alive heartbeat

---

## 📜 Smart Contracts

### Job Contract

Located at `programs/onchain-program/src/lib.rs`

**Instructions:**

1. **create_job** - Initialize a new job account

```rust
pub fn create_job(ctx: Context<CreateJob>, job_id: u64) -> Result<()>
```

2. **execute_job** - Store ZK proof result on-chain

```rust
pub fn execute_job(ctx: Context<ExecuteJob>, result: Vec<u8>) -> Result<()>
```

**Program ID (Devnet):**

```
YOUR_PROGRAM_ID_HERE
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Agents Getting Paused on Refresh

**Cause:** Missing database migration for `parameters` field

**Solution:**

```bash
cd executor
npx prisma migrate dev --name add_parameters_field
```

#### 2. SSE Not Receiving Logs

**Cause:** Frontend not connected to SSE stream

**Solution:**

- Check browser console for "SSE connected" message
- Verify backend is running on port 3001
- Check firewall/CORS settings

#### 3. Transaction Submission Fails

**Cause:** Jito relayer endpoints down or rate limited

**Solution:**

- Backend automatically falls back to direct Solana RPC
- Check executor wallet has sufficient SOL balance
- Verify RPC URL is correct in `.env`

#### 4. Database Connection Error

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**

```bash
systemctl start postgresql

psql -U postgres -c "CREATE DATABASE aegis;"

cd executor && npx prisma migrate reset
```

#### 5. ZK Agent Build Fails

**Cause:** Missing Rust toolchain or dependencies

**Solution:**

```bash
rustup update stable
cd zk-agent
cargo clean
cargo build --release
```

### Debug Mode

Enable verbose logging:

**Backend:**

```bash
cd executor
LOG_LEVEL=debug npm run start:dev
```

**Frontend:**

```bash
cd frontend
NEXT_PUBLIC_DEBUG=true npm run dev
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Run linters before committing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **RISC Zero** - Zero-knowledge proof framework
- **Anchor** - Solana program framework
- **Jito Labs** - MEV protection
- **Orca & Raydium** - DEX integrations

---

## 📞 Support

- **Documentation:** [https://docs.aegis.io](https://docs.aegis.io)
- **Discord:** [https://discord.gg/aegis](https://discord.gg/aegis)
- **Twitter:** [@AegisProtocol](https://twitter.com/AegisProtocol)
- **Email:** support@aegis.io

---

<div align="center">

**Built with ❤️ by the AEGIS Team**

[Website](https://aegis.io) • [Docs](https://docs.aegis.io) • [Twitter](https://twitter.com/AegisProtocol) • [Discord](https://discord.gg/aegis)

</div>
