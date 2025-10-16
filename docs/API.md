# AEGIS API Documentation

## Overview

The AEGIS API provides RESTful endpoints for managing autonomous trading agents on Solana. All endpoints require wallet authentication and return JSON responses.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://your-backend-url.com`

## Authentication

All API requests require a `walletAddress` query parameter for authentication:

```http
GET /jobs?walletAddress=YOUR_WALLET_ADDRESS
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Jobs Management

#### Create One-Shot Job

Creates a single execution job (non-continuous).

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

**Response:**
```json
{
  "message": "Job accepted and is being processed."
}
```

#### Start Continuous Agent

Starts a continuous monitoring agent that runs indefinitely.

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

**Response:**
```json
{
  "message": "Continuous agent started successfully."
}
```

#### Pause Agent

Pauses a running continuous agent.

```http
POST /jobs/pause/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Response:**
```json
{
  "message": "Agent paused successfully."
}
```

#### Restart Agent

Restarts a paused or stopped agent.

```http
POST /jobs/restart/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Response:**
```json
{
  "message": "Agent restarted successfully"
}
```

#### Get Agent Status

Retrieves the current status of a specific agent.

```http
GET /jobs/status/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Response:**
```json
{
  "jobId": 1760254134636,
  "walletAddress": "9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t",
  "isRunning": true,
  "status": "RUNNING"
}
```

#### Get All Jobs

Retrieves all jobs for a specific wallet address.

```http
GET /jobs?walletAddress=YOUR_WALLET_ADDRESS
```

**Response:**
```json
[
  {
    "id": 1,
    "jobId": "1760254134636",
    "status": "RUNNING",
    "agentType": "arbitrage",
    "result": null,
    "parameters": "{\"profitThreshold\":0.5}",
    "createdAt": "2025-10-16T16:43:55.010Z",
    "updatedAt": "2025-10-16T16:43:55.010Z",
    "userWalletAddress": "9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t"
  }
]
```

#### Get Execution Logs

Retrieves execution logs for a specific job.

```http
GET /jobs/execution-logs?walletAddress=YOUR_WALLET_ADDRESS&jobId=JOB_ID
```

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "10:13:55 pm",
    "action": "Job Created",
    "result": "Arbitrage agent initialized for job #1760254134636",
    "tx": null
  },
  {
    "id": 2,
    "timestamp": "10:13:56 pm",
    "action": "ZK Proof Generation",
    "result": "ZK agent invoked and receipt generated",
    "tx": null
  },
  {
    "id": 3,
    "timestamp": "10:26:22 pm",
    "action": "Monitoring Active",
    "result": "Agent is continuously monitoring for arbitrage opportunities. Check back shortly for updates!",
    "tx": null
  }
]
```

#### Delete Job

Deletes a specific job and its associated data.

```http
DELETE /jobs/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Response:**
```json
{
  "message": "Job deleted successfully"
}
```

### Real-Time Updates (SSE)

#### Connect to Job Stream

Establishes a Server-Sent Events connection for real-time updates.

```http
GET /jobs/stream/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Headers:**
```
Accept: text/event-stream
Cache-Control: no-cache
```

**Event Types:**

1. **Connected Event**
```json
{
  "type": "connected",
  "message": "Connected to job stream"
}
```

2. **Log Update Event**
```json
{
  "type": "log_update",
  "data": [
    {
      "id": 4,
      "timestamp": "10:30:10 pm",
      "action": "Monitoring",
      "result": "Iteration 1: Analyzing market conditions...",
      "tx": null
    }
  ]
}
```

3. **Job Update Event**
```json
{
  "type": "job_update",
  "data": {
    "status": "RUNNING",
    "message": "Agent is continuously monitoring for arbitrage opportunities",
    "result": null,
    "pnl": 0,
    "tradesExecuted": 0
  }
}
```

4. **Ping Event**
```json
{
  "type": "ping"
}
```

### Authentication

#### Request Message

Generates a message for wallet signature authentication.

```http
POST /auth/request-message
Content-Type: application/json

{
  "walletAddress": "YOUR_WALLET_ADDRESS"
}
```

**Response:**
```json
{
  "message": "Sign this message to authenticate with AEGIS: [timestamp]"
}
```

#### Login

Authenticates using a signed message.

```http
POST /auth/login
Content-Type: application/json

{
  "walletAddress": "YOUR_WALLET_ADDRESS",
  "signature": "SIGNED_MESSAGE_SIGNATURE"
}
```

**Response:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_HERE"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `WALLET_REQUIRED` | Wallet address is required |
| `INVALID_JOB_ID` | Invalid job ID provided |
| `AGENT_NOT_FOUND` | Agent not found |
| `AGENT_ALREADY_RUNNING` | Agent is already running |
| `INSUFFICIENT_BALANCE` | Executor wallet has insufficient SOL |
| `RELAYER_UNAVAILABLE` | All relayer endpoints are down |
| `ZK_AGENT_FAILED` | ZK agent execution failed |
| `DATABASE_ERROR` | Database operation failed |

## Rate Limiting

- **Job Creation**: 10 requests per minute per wallet
- **Status Checks**: 60 requests per minute per wallet
- **SSE Connections**: 5 concurrent connections per wallet

## Webhooks (Future)

Planned webhook endpoints for external integrations:

- `POST /webhooks/job-completed` - Job completion notifications
- `POST /webhooks/trade-executed` - Trade execution notifications
- `POST /webhooks/agent-error` - Agent error notifications

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

class AegisAPI {
  private walletAddress: string;

  constructor(walletAddress: string) {
    this.walletAddress = walletAddress;
  }

  async startAgent(jobId: number, profitThreshold: number = 0.5) {
    const response = await axios.post(`${API_BASE}/jobs/start-continuous`, {
      jobId,
      userWalletAddress: this.walletAddress,
      parameters: { profitThreshold }
    });
    return response.data;
  }

  async pauseAgent(jobId: number) {
    const response = await axios.post(
      `${API_BASE}/jobs/pause/${jobId}?walletAddress=${this.walletAddress}`
    );
    return response.data;
  }

  async restartAgent(jobId: number) {
    const response = await axios.post(
      `${API_BASE}/jobs/restart/${jobId}?walletAddress=${this.walletAddress}`
    );
    return response.data;
  }

  async getAgentStatus(jobId: number) {
    const response = await axios.get(
      `${API_BASE}/jobs/status/${jobId}?walletAddress=${this.walletAddress}`
    );
    return response.data;
  }

  async getAllJobs() {
    const response = await axios.get(
      `${API_BASE}/jobs?walletAddress=${this.walletAddress}`
    );
    return response.data;
  }

  connectToStream(jobId: number, onMessage: (data: any) => void) {
    const eventSource = new EventSource(
      `${API_BASE}/jobs/stream/${jobId}?walletAddress=${this.walletAddress}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    return eventSource;
  }
}

// Usage
const api = new AegisAPI('YOUR_WALLET_ADDRESS');

// Start an agent
await api.startAgent(1760254134636, 0.5);

// Connect to real-time updates
const stream = api.connectToStream(1760254134636, (data) => {
  console.log('Received update:', data);
});
```

### Python

```python
import requests
import json
from typing import Dict, List, Optional

class AegisAPI:
    def __init__(self, base_url: str, wallet_address: str):
        self.base_url = base_url
        self.wallet_address = wallet_address

    def start_agent(self, job_id: int, profit_threshold: float = 0.5) -> Dict:
        response = requests.post(
            f"{self.base_url}/jobs/start-continuous",
            json={
                "jobId": job_id,
                "userWalletAddress": self.wallet_address,
                "parameters": {"profitThreshold": profit_threshold}
            }
        )
        return response.json()

    def pause_agent(self, job_id: int) -> Dict:
        response = requests.post(
            f"{self.base_url}/jobs/pause/{job_id}",
            params={"walletAddress": self.wallet_address}
        )
        return response.json()

    def restart_agent(self, job_id: int) -> Dict:
        response = requests.post(
            f"{self.base_url}/jobs/restart/{job_id}",
            params={"walletAddress": self.wallet_address}
        )
        return response.json()

    def get_agent_status(self, job_id: int) -> Dict:
        response = requests.get(
            f"{self.base_url}/jobs/status/{job_id}",
            params={"walletAddress": self.wallet_address}
        )
        return response.json()

    def get_all_jobs(self) -> List[Dict]:
        response = requests.get(
            f"{self.base_url}/jobs",
            params={"walletAddress": self.wallet_address}
        )
        return response.json()

# Usage
api = AegisAPI("http://localhost:3001", "YOUR_WALLET_ADDRESS")

# Start an agent
result = api.start_agent(1760254134636, 0.5)
print(f"Agent started: {result}")

# Get all jobs
jobs = api.get_all_jobs()
print(f"Total jobs: {len(jobs)}")
```

## Testing

### Postman Collection

Import the following collection for API testing:

```json
{
  "info": {
    "name": "AEGIS API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Start Continuous Agent",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jobId\": 1760254134636,\n  \"userWalletAddress\": \"YOUR_WALLET_ADDRESS\",\n  \"parameters\": {\n    \"profitThreshold\": 0.5\n  }\n}"
        },
        "url": {
          "raw": "{{base_url}}/jobs/start-continuous",
          "host": ["{{base_url}}"],
          "path": ["jobs", "start-continuous"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001"
    }
  ]
}
```

## Changelog

### v1.2.0 (Current)
- Added restart agent endpoint
- Enhanced auto-restart functionality
- Improved error handling
- Added comprehensive logging

### v1.1.0
- Added continuous agent support
- Implemented SSE for real-time updates
- Added pause/resume functionality
- Enhanced dashboard integration

### v1.0.0
- Initial API release
- Basic job management
- Authentication system
- Database integration

---

**Last Updated**: October 16, 2025

For more information, see the [main README](../README.md) and [Architecture Documentation](ARCHITECTURE.md).
