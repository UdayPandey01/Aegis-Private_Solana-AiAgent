# Auto-Restart Functionality Guide

## Overview

The AEGIS platform includes comprehensive auto-restart functionality to ensure agents continue running even after backend restarts, deployments, or failures. This guide explains how the auto-restart system works and how to configure it.

## How Auto-Restart Works

### 1. Automatic Detection

The dashboard automatically detects when agents are marked as "RUNNING" in the database but are not actually running in memory:

```typescript
// Dashboard checks every 30 seconds
const runningAgents = userJobs.filter((job) => job.status === "RUNNING");
for (const agent of runningAgents) {
  const statusResponse = await axios.get(
    API_ENDPOINTS.jobStatus(agent.id.toString())
  );

  if (!statusResponse.data.isRunning) {
    // Auto-restart the agent
    await axios.post(
      API_ENDPOINTS.restartJob(agent.id.toString(), publicKey.toBase58())
    );
  }
}
```

### 2. Manual Restart

Users can manually restart agents using:

- **Dashboard Button**: "Restart Agent" button in the agent detail page
- **API Endpoint**: `POST /jobs/restart/:jobId`
- **Programmatic**: Direct API calls from external applications

### 3. Backend Restart Logic

When the backend starts, it can optionally restore all running agents:

```typescript
// In JobsService.onModuleInit()
const runningJobs = await this.prisma.job.findMany({
  where: { status: "RUNNING" },
});

for (const job of runningJobs) {
  // Restart each agent with saved parameters
  await this.restartAgent(Number(job.jobId), job.userWalletAddress);
}
```

## Configuration

### Environment Variables

```env
# Enable/disable auto-restore on startup (default: false for free tier)
AUTO_RESTORE_AGENTS=true

# Dashboard auto-check interval (default: 30000ms)
DASHBOARD_CHECK_INTERVAL=30000

# Agent monitoring interval (default: 10000ms)
AGENT_MONITORING_INTERVAL=10000
```

### Free Tier vs Paid Tier

**Free Tier (Default)**

- Auto-restore on startup: **Disabled** (saves ~150MB memory)
- Dashboard auto-restart: **Enabled** (checks every 30 seconds)
- Manual restart: **Enabled**

**Paid Tier**

- Auto-restore on startup: **Enabled**
- Dashboard auto-restart: **Enabled**
- Manual restart: **Enabled**
- Enhanced monitoring: **Enabled**

## API Endpoints

### Restart Agent

```http
POST /jobs/restart/:jobId?walletAddress=YOUR_WALLET_ADDRESS
```

**Request:**

```json
{
  "jobId": "1760254134636",
  "walletAddress": "9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t"
}
```

**Response:**

```json
{
  "message": "Agent restarted successfully"
}
```

**Error Responses:**

```json
{
  "message": "Agent not found"
}
```

```json
{
  "message": "Failed to restart agent"
}
```

### Check Agent Status

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

## Implementation Details

### Backend Implementation

#### JobsService.restartAgent()

```typescript
async restartAgent(jobId: number, userWalletAddress: string): Promise<boolean> {
  const agentId = `${jobId}_${userWalletAddress}`;

  try {
    // 1. Get job from database
    const job = await this.prisma.job.findFirst({
      where: {
        jobId: BigInt(jobId),
        userWalletAddress: userWalletAddress
      }
    });

    if (!job) {
      return false;
    }

    // 2. Stop existing agent if running
    if (this.runningAgents.has(agentId)) {
      this.runningAgents.set(agentId, false);
    }

    // 3. Parse parameters
    let parameters = { profitThreshold: 0.5 };
    if (job.parameters) {
      parameters = JSON.parse(job.parameters);
    }

    // 4. Update database status
    await this.prisma.job.updateMany({
      where: {
        jobId: BigInt(jobId),
        userWalletAddress: userWalletAddress
      },
      data: { status: 'RUNNING' }
    });

    // 5. Start the agent
    this.runningAgents.set(agentId, true);
    const loopPromise = this.runContinuousLoop(jobId, userWalletAddress, parameters);
    this.agentLoops.set(agentId, loopPromise);

    // 6. Emit restart log
    this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
      id: Date.now(),
      timestamp: this.formatTimestamp(),
      action: "Agent Restarted",
      result: "Agent restarted successfully. Monitoring for arbitrage opportunities...",
      tx: null,
    }]);

    return true;
  } catch (error) {
    this.logger.error(`Failed to restart agent ${agentId}:`, error);
    return false;
  }
}
```

### Frontend Implementation

#### Dashboard Auto-Check

```typescript
useEffect(() => {
  const fetchData = async () => {
    // ... fetch jobs ...

    // Auto-restart agents that are marked as RUNNING but may have stopped
    const runningAgents = userJobs.filter((job) => job.status === "RUNNING");
    for (const agent of runningAgents) {
      try {
        const statusResponse = await axios.get(
          API_ENDPOINTS.jobStatus(agent.id.toString()),
          {
            params: { walletAddress: publicKey.toBase58() },
          }
        );

        if (!statusResponse.data.isRunning) {
          console.log(
            `Agent ${agent.id} marked as RUNNING but not actually running. Auto-restarting...`
          );
          await axios.post(
            API_ENDPOINTS.restartJob(agent.id.toString(), publicKey.toBase58())
          );
          console.log(`✅ Auto-restarted agent ${agent.id}`);
        }
      } catch (error) {
        console.error(`Failed to check/restart agent ${agent.id}:`, error);
      }
    }
  };

  // Check every 30 seconds
  const refreshInterval = setInterval(fetchData, 30000);
  return () => clearInterval(refreshInterval);
}, [publicKey]);
```

#### Manual Restart Button

```typescript
<Button
  onClick={async () => {
    if (!publicKey) return;
    try {
      await axios.post(
        API_ENDPOINTS.restartJob(agent.id.toString(), publicKey.toBase58())
      );
      console.log("Agent restarted successfully");
      window.location.reload(); // Refresh to show updated logs
    } catch (error) {
      console.error("Failed to restart agent:", error);
      alert("Failed to restart agent. Please try again.");
    }
  }}
  variant="outline"
  className="font-sans flex items-center gap-2"
>
  <Activity className="h-4 w-4" /> Restart Agent
</Button>
```

## Monitoring and Logging

### Restart Events

All restart events are logged and sent via SSE:

```json
{
  "id": 1760254134636,
  "timestamp": "10:30:10 pm",
  "action": "Agent Restarted",
  "result": "Agent restarted successfully. Monitoring for arbitrage opportunities...",
  "tx": null
}
```

### Console Logs

Backend logs show restart activities:

```
[JobsService] ✅ Agent 1760254134636_9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t restarted successfully with parameters: {"profitThreshold":0.5}
[SSEService] Emitting log update for job 1760254134636
```

Frontend logs show auto-restart detection:

```
Checking if agent 1760254134636 is actually running...
Agent 1760254134636 marked as RUNNING but not actually running. Auto-restarting...
✅ Auto-restarted agent 1760254134636
```

## Troubleshooting

### Common Issues

#### 1. Agents Not Auto-Restarting

**Symptoms:**

- Agents show as "RUNNING" but no logs appear
- Dashboard doesn't detect stopped agents

**Solutions:**

1. Check browser console for auto-restart logs
2. Verify API endpoints are accessible
3. Check network connectivity
4. Manually restart using the button

#### 2. Manual Restart Fails

**Symptoms:**

- "Restart Agent" button doesn't work
- API returns error responses

**Solutions:**

1. Check wallet connection
2. Verify agent exists in database
3. Check backend logs for errors
4. Ensure sufficient permissions

#### 3. Multiple Restart Attempts

**Symptoms:**

- Multiple restart logs appear
- Agent starts multiple times

**Solutions:**

1. Check for race conditions
2. Verify agent status before restarting
3. Implement restart cooldown period

### Debug Mode

Enable debug logging to troubleshoot restart issues:

```bash
# Backend
LOG_LEVEL=debug npm run start:dev

# Frontend
NEXT_PUBLIC_DEBUG=true npm run dev
```

### Health Checks

Monitor agent health with these endpoints:

```bash
# Check if agent is running
curl "http://localhost:3001/jobs/status/1760254134636?walletAddress=YOUR_WALLET"

# Get all jobs
curl "http://localhost:3001/jobs?walletAddress=YOUR_WALLET"

# Check backend health
curl "http://localhost:3001/health"
```

## Best Practices

### 1. Graceful Shutdowns

Always shut down agents gracefully:

```typescript
// In your shutdown handler
await this.jobsService.pauseAllAgents();
```

### 2. Database Consistency

Ensure database status matches actual agent state:

```typescript
// Update database when agent stops
await this.prisma.job.updateMany({
  where: { jobId: BigInt(jobId) },
  data: { status: "PAUSED" },
});
```

### 3. Error Handling

Implement proper error handling for restart operations:

```typescript
try {
  await this.restartAgent(jobId, walletAddress);
} catch (error) {
  this.logger.error("Restart failed:", error);
  // Notify user or retry
}
```

### 4. Rate Limiting

Prevent excessive restart attempts:

```typescript
const lastRestart = this.restartTimes.get(agentId);
if (lastRestart && Date.now() - lastRestart < 5000) {
  throw new Error("Restart cooldown active");
}
this.restartTimes.set(agentId, Date.now());
```

## Performance Considerations

### Memory Usage

- **Auto-restore disabled**: Saves ~150MB memory on free tier
- **Auto-restore enabled**: Uses additional memory for each restored agent
- **Dashboard checks**: Minimal impact, runs every 30 seconds

### Database Load

- **Status checks**: 1 query per running agent every 30 seconds
- **Restart operations**: 2-3 queries per restart (read, update, verify)
- **SSE connections**: Minimal database impact

### Network Traffic

- **Dashboard checks**: ~1KB per agent every 30 seconds
- **Restart operations**: ~2KB per restart
- **SSE updates**: ~500 bytes per log update

## Future Enhancements

### Planned Features

1. **Smart Restart Logic**

   - Restart only if agent has been stopped for X minutes
   - Exponential backoff for failed restarts
   - Health check before restart

2. **Bulk Operations**

   - Restart all agents for a user
   - Restart agents by status
   - Scheduled restarts

3. **Advanced Monitoring**

   - Restart success/failure metrics
   - Performance impact tracking
   - Alert system for failed restarts

4. **Configuration UI**
   - Enable/disable auto-restart per agent
   - Configure restart intervals
   - Set restart conditions

---

**Last Updated**: October 16, 2025

For more information, see the [API Documentation](API.md) and [main README](../README.md).
