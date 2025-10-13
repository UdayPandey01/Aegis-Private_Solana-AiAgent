"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import bs58 from "bs58";

export function useAuth() {
    const { publicKey, signMessage, connected } = useWallet();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);

    const authenticate = useCallback(async () => {
        if (!publicKey || !signMessage || !connected) {
            setIsAuthenticated(false);
            setAuthToken(null);
            return;
        }

        // Check if already authenticated for this wallet
        const storedToken = localStorage.getItem(`auth_token_${publicKey.toBase58()}`);
        if (storedToken) {
            setAuthToken(storedToken);
            setIsAuthenticated(true);
            return;
        }

        try {
            setIsAuthenticating(true);

            // Step 1: Request challenge message from backend
            const { data: { message } } = await axios.post(
                `${API_ENDPOINTS.base}/auth/request-message`,
                { publicKey: publicKey.toBase58() }
            );

            // Step 2: Ask user to sign the message
            const messageBytes = new TextEncoder().encode(message);
            const signature = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signature);

            // Step 3: Send signature to backend for verification
            const { data: { token } } = await axios.post(
                `${API_ENDPOINTS.base}/auth/login`,
                {
                    publicKey: publicKey.toBase58(),
                    signature: signatureBase58,
                }
            );

            // Store token and mark as authenticated
            localStorage.setItem(`auth_token_${publicKey.toBase58()}`, token);
            setAuthToken(token);
            setIsAuthenticated(true);

            console.log("✅ Authentication successful!");
        } catch (error) {
            console.error("Authentication failed:", error);
            setIsAuthenticated(false);
            setAuthToken(null);

            // Show user-friendly error
            if (axios.isAxiosError(error)) {
                alert(`Authentication failed: ${error.response?.data?.message || error.message}`);
            } else {
                alert("Authentication failed. Please try again.");
            }
        } finally {
            setIsAuthenticating(false);
        }
    }, [publicKey, signMessage, connected]);

    // Auto-authenticate when wallet connects
    useEffect(() => {
        if (connected && publicKey && signMessage) {
            authenticate();
        } else {
            // Clear auth state when wallet disconnects
            setIsAuthenticated(false);
            setAuthToken(null);
            if (publicKey) {
                localStorage.removeItem(`auth_token_${publicKey.toBase58()}`);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, publicKey, signMessage]);

    const logout = useCallback(() => {
        if (publicKey) {
            localStorage.removeItem(`auth_token_${publicKey.toBase58()}`);
        }
        setIsAuthenticated(false);
        setAuthToken(null);
    }, [publicKey]);

    return {
        isAuthenticated,
        isAuthenticating,
        authToken,
        authenticate,
        logout,
    };
}

