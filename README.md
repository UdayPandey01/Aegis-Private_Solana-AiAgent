# Aegis: Private AI Agent Framework for Solana

![Language](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Language](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Framework](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Framework](https://img.shields.io/badge/RISC%20Zero-CC0000?style=for-the-badge&logo=risczero&logoColor=white)
![Platform](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Aegis is a trust-minimized execution environment for Solana that enables a new generation of private, autonomous AI agents. [cite_start]It solves the critical on-chain problems of **MEV**, **alpha leakage**, and the **private data barrier** by separating confidential off-chain computation from on-chain settlement[cite: 12]. By leveraging a Zero-Knowledge Virtual Machine (zkVM), Aegis allows agents to operate on sensitive data and execute proprietary logic without ever exposing it on a public ledger.

---

## Architectural Overview 🏗️

[cite_start]The Aegis framework coordinates a flow between a user, an off-chain Executor Service, a ZK agent, and the Solana blockchain[cite: 18]. [cite_start]All on-chain actions are submitted through a private relayer to shield them from the public mempool[cite: 15].

```mermaid
graph TD
    subgraph User
        A[CLI Client]
    end

    subgraph Off-Chain Services
        B(Executor Service - TypeScript)
        C(ZK Proof Host - Rust)
        D(ZK Agent / Guest - Rust)
    end

    subgraph Privacy Layer
        R[Private Relayer (Jito)]
    end

    subgraph On-Chain
        S[Solana Program - Anchor]
    end

    A -- "1. Submit Job (HTTP POST)" --> B
    B -- "2. Invokes Agent" --> C
    C -- "3. Executes Guest Logic" --> D
    D -- "4. Produces ZK Receipt" --> B
    B -- "5. Verifies Receipt & Creates Tx" --> R
    R -- "6. Submits Private Bundle" --> S