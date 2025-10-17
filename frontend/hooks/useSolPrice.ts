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
        price: 150, // Fallback price
        change24h: 0,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                setPriceData(prev => ({ ...prev, isLoading: true, error: null }));

                // Try multiple price sources for reliability
                const priceSources = [
                    // CoinGecko API (free, reliable)
                    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
                    // Alternative: Jupiter API (Solana-specific)
                    'https://price.jup.ag/v4/price?ids=SOL',
                ];

                let price = 183;
                let change24h = 0;

                for (const source of priceSources) {
                    try {
                        const response = await fetch(source, {
                            headers: {
                                'Accept': 'application/json',
                            },
                        });

                        if (!response.ok) continue;

                        const data = await response.json();

                        if (source.includes('coingecko')) {
                            if (data.solana?.usd) {
                                price = data.solana.usd;
                                change24h = data.solana.usd_24h_change || 0;
                                break;
                            }
                        } else if (source.includes('jup.ag')) {
                            if (data.data?.SOL?.price) {
                                price = data.data.SOL.price;
                                // Jupiter doesn't provide 24h change, so we'll keep it at 0
                                break;
                            }
                        }
                    } catch (sourceError) {
                        console.warn(`Failed to fetch from ${source}:`, sourceError);
                        continue;
                    }
                }

                setPriceData({
                    price,
                    change24h,
                    isLoading: false,
                    error: null,
                });

            } catch (error) {
                console.error('Failed to fetch SOL price:', error);
                setPriceData(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to fetch price',
                }));
            }
        };

        // Fetch immediately
        fetchSolPrice();

        // Set up interval to refresh every 30 seconds
        const interval = setInterval(fetchSolPrice, 30000);

        return () => clearInterval(interval);
    }, []);

    return priceData;
};
