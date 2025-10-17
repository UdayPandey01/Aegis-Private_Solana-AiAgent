'use client';

import { useState, useEffect } from 'react';

interface SolPriceData {
    price: number;
    change24h: number;
    isLoading: boolean;
    error: string | null;
}

export const useSolPrice = () => {
    const [priceData, setPriceData] = useState<SolPriceData>({
        price: 180, // Reliable fallback price for demo
        change24h: 2.5, // Mock 24h change for demo
        isLoading: false, // Start with false to avoid loading state
        error: null,
    });

    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                // Use a simple, reliable price source
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true', {
                    headers: {
                        'Accept': 'application/json',
                    },
                    // Add timeout to prevent hanging
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.solana?.usd) {
                        setPriceData({
                            price: data.solana.usd,
                            change24h: data.solana.usd_24h_change || 0,
                            isLoading: false,
                            error: null,
                        });
                        return;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch SOL price, using fallback:', error);
            }

            // If API fails, keep the fallback values (no error state for demo)
            setPriceData(prev => ({
                ...prev,
                isLoading: false,
                error: null, // Don't show error for demo
            }));
        };

        // Fetch immediately
        fetchSolPrice();

        // Set up interval to refresh every 60 seconds (less frequent)
        const interval = setInterval(fetchSolPrice, 60000);

        return () => clearInterval(interval);
    }, []);

    return priceData;
};
