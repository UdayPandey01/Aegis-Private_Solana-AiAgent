export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
    base: API_BASE_URL,
    auth: {
        requestMessage: `${API_BASE_URL}/auth/request-message`,
        login: `${API_BASE_URL}/auth/login`,
        checkUser: (walletAddress: string) =>
            `${API_BASE_URL}/auth/debug/check-user?walletAddress=${walletAddress}`,
        listUsers: `${API_BASE_URL}/auth/debug/list-users`,
    },
    jobs: `${API_BASE_URL}/jobs`,
    startContinuous: `${API_BASE_URL}/jobs/start-continuous`,
    executionLogs: (walletAddress: string, jobId: string) =>
        `${API_BASE_URL}/jobs/execution-logs?walletAddress=${walletAddress}&jobId=${jobId}`,
    jobStatus: (jobId: string) => `${API_BASE_URL}/jobs/status/${jobId}`,
    jobsByWallet: (walletAddress: string) => `${API_BASE_URL}/jobs?walletAddress=${walletAddress}`,
    deleteJob: (jobId: string, walletAddress: string) =>
        `${API_BASE_URL}/jobs/${jobId}?walletAddress=${walletAddress}`,
    restartJob: (jobId: string, walletAddress: string) =>
        `${API_BASE_URL}/jobs/restart/${jobId}?walletAddress=${walletAddress}`,
    streamJob: (jobId: string, walletAddress: string) =>
        `${API_BASE_URL}/jobs/stream/${jobId}?walletAddress=${encodeURIComponent(walletAddress)}`,
};

