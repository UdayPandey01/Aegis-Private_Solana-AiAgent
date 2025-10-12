import { useEffect, useRef, useState } from 'react';

interface UseSSEReturn {
    isConnected: boolean;
    connect: (jobId: string, userWalletAddress: string) => void;
    disconnect: () => void;
    addEventListener: (eventType: string, callback: (data: any) => void) => void;
    removeEventListener: (eventType: string, callback: (data: any) => void) => void;
}

export const useSSE = (): UseSSEReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const addEventListener = (eventType: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(eventType)) {
            listenersRef.current.set(eventType, new Set());
        }
        listenersRef.current.get(eventType)!.add(callback);
    };

    const removeEventListener = (eventType: string, callback: (data: any) => void) => {
        const listeners = listenersRef.current.get(eventType);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                listenersRef.current.delete(eventType);
            }
        }
    };

    const connect = (jobId: string, userWalletAddress: string) => {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Don't reconnect if already connected to the same job
        if (eventSourceRef.current && eventSourceRef.current.url.includes(jobId)) {
            return;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `http://localhost:3001/jobs/stream/${jobId}?walletAddress=${encodeURIComponent(userWalletAddress)}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
            console.log('SSE connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle ping messages
                if (data.type === 'ping') {
                    return;
                }

                // Call all listeners for this event type
                const listeners = listenersRef.current.get(data.type);
                if (listeners) {
                    listeners.forEach(callback => callback(data.data));
                }

                // Also call listeners for 'message' type for backward compatibility
                const messageListeners = listenersRef.current.get('message');
                if (messageListeners) {
                    messageListeners.forEach(callback => callback(data));
                }
            } catch (error) {
                console.error('Failed to parse SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            setIsConnected(false);

            // Attempt to reconnect with exponential backoff
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // 1s, 2s, 4s, 8s, 16s
                reconnectAttemptsRef.current++;

                console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect(jobId, userWalletAddress);
                }, delay);
            } else {
                console.error('Max reconnection attempts reached');
            }
        };
    };

    const disconnect = () => {
        // Clear any pending reconnect attempts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
            console.log('SSE disconnected');
        }
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        isConnected,
        connect,
        disconnect,
        addEventListener,
        removeEventListener,
    };
};
