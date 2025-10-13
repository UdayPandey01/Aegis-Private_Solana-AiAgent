// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
    jobs: `${API_BASE_URL}/jobs`,
    startContinuous: `${API_BASE_URL}/jobs/start-continuous`,
    executionLogs: (walletAddress: string, jobId: string) =>
        `${API_BASE_URL}/jobs/execution-logs?walletAddress=${walletAddress}&jobId=${jobId}`,
    jobStatus: (jobId: string) => `${API_BASE_URL}/jobs/status/${jobId}`,
    jobsByWallet: (walletAddress: string) => `${API_BASE_URL}/jobs?walletAddress=${walletAddress}`,
    deleteJob: (jobId: string, walletAddress: string) =>
        `${API_BASE_URL}/jobs/${jobId}?walletAddress=${walletAddress}`,
    streamJob: (jobId: string, walletAddress: string) =>
        `${API_BASE_URL}/jobs/stream/${jobId}?walletAddress=${encodeURIComponent(walletAddress)}`,
};

