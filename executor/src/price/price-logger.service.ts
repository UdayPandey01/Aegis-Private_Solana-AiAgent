import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface PriceData {
    dex: string;
    tokenPair: string;
    price: number;
    timestamp: Date;
    source: string;
}

@Injectable()
export class PriceLoggerService {
    private readonly logger = new Logger(PriceLoggerService.name);

    // DEX API endpoints
    private readonly ORCA_API = 'https://api.mainnet.orca.so/v1/whirlpool/list';
    private readonly RAYDIUM_API = 'https://api.raydium.io/v2/sdk/token/raydium.mainnet.json';
    private readonly JUPITER_API = 'https://quote-api.jup.ag/v6/quote';
    private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

    async logPricesBeforeArbitrage(profitThreshold: number): Promise<PriceData[]> {
        this.logger.log('Fetching prices from DEXes for arbitrage analysis...');

        const prices: PriceData[] = [];
        const timestamp = new Date();

        try {
            // Fetch Orca prices
            const orcaPrices = await this.fetchOrcaPrices(timestamp);
            prices.push(...orcaPrices);

            // Fetch Raydium prices
            const raydiumPrices = await this.fetchRaydiumPrices(timestamp);
            prices.push(...raydiumPrices);

            // Fetch Jupiter quotes for comparison
            const jupiterPrices = await this.fetchJupiterQuotes(timestamp);
            prices.push(...jupiterPrices);

            // Fetch CoinGecko prices for reference
            const coingeckoPrices = await this.fetchCoinGeckoPrices(timestamp);
            prices.push(...coingeckoPrices);

            // Log all prices
            this.logPrices(prices, profitThreshold);

            return prices;
        } catch (error) {
            this.logger.error('Failed to fetch prices:', error);
            throw error;
        }
    }

    private async fetchOrcaPrices(timestamp: Date): Promise<PriceData[]> {
        try {
            this.logger.log('Fetching Orca prices...');

            // Orca API call to get whirlpool data
            const response = await axios.get(this.ORCA_API, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            const prices: PriceData[] = [];

            if (response.data && Array.isArray(response.data)) {
                // Look for SOL/USDC pairs
                const solUsdcPools = response.data.filter((pool: any) =>
                    pool.tokenA?.symbol === 'SOL' && pool.tokenB?.symbol === 'USDC' ||
                    pool.tokenA?.symbol === 'USDC' && pool.tokenB?.symbol === 'SOL'
                );

                solUsdcPools.forEach((pool: any) => {
                    if (pool.price) {
                        prices.push({
                            dex: 'Orca',
                            tokenPair: 'SOL/USDC',
                            price: parseFloat(pool.price),
                            timestamp,
                            source: 'Orca Whirlpool API'
                        });
                    }
                });
            }

            this.logger.log(`Found ${prices.length} Orca price(s)`);
            return prices;
        } catch (error) {
            this.logger.error('Failed to fetch Orca prices:', error.message);
            return [];
        }
    }

    private async fetchRaydiumPrices(timestamp: Date): Promise<PriceData[]> {
        try {
            this.logger.log('Fetching Raydium prices...');

            // Raydium API call
            const response = await axios.get(this.RAYDIUM_API, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            const prices: PriceData[] = [];

            if (response.data && response.data.tokens) {
                // Look for SOL and USDC tokens
                const solToken = response.data.tokens.find((token: any) =>
                    token.symbol === 'SOL' && token.chainId === 101
                );
                const usdcToken = response.data.tokens.find((token: any) =>
                    token.symbol === 'USDC' && token.chainId === 101
                );

                if (solToken && usdcToken && solToken.price && usdcToken.price) {
                    const solPrice = parseFloat(solToken.price);
                    const usdcPrice = parseFloat(usdcToken.price);
                    const solUsdcPrice = solPrice / usdcPrice; // SOL price in USDC

                    prices.push({
                        dex: 'Raydium',
                        tokenPair: 'SOL/USDC',
                        price: solUsdcPrice,
                        timestamp,
                        source: 'Raydium Token API'
                    });
                }
            }

            this.logger.log(`Found ${prices.length} Raydium price(s)`);
            return prices;
        } catch (error) {
            this.logger.error('Failed to fetch Raydium prices:', error.message);
            return [];
        }
    }

    private async fetchJupiterQuotes(timestamp: Date): Promise<PriceData[]> {
        try {
            this.logger.log('Fetching Jupiter quotes...');

            // Jupiter quote API for SOL to USDC
            const response = await axios.get(`${this.JUPITER_API}?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000000&slippageBps=50`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            const prices: PriceData[] = [];

            if (response.data && response.data.outAmount) {
                // Convert lamports to SOL and calculate price
                const solAmount = 1; // 1 SOL
                const usdcAmount = parseFloat(response.data.outAmount) / 1000000; // Convert from micro USDC to USDC
                const price = usdcAmount / solAmount;

                prices.push({
                    dex: 'Jupiter',
                    tokenPair: 'SOL/USDC',
                    price: price,
                    timestamp,
                    source: 'Jupiter Quote API'
                });
            }

            this.logger.log(`Found ${prices.length} Jupiter quote(s)`);
            return prices;
        } catch (error) {
            this.logger.error('Failed to fetch Jupiter quotes:', error.message);
            return [];
        }
    }

    private async fetchCoinGeckoPrices(timestamp: Date): Promise<PriceData[]> {
        try {
            this.logger.log('Fetching CoinGecko prices...');

            // CoinGecko API for SOL price in USD
            const response = await axios.get(`${this.COINGECKO_API}?ids=solana&vs_currencies=usd`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            const prices: PriceData[] = [];

            if (response.data && response.data.solana && response.data.solana.usd) {
                const solPrice = parseFloat(response.data.solana.usd);

                prices.push({
                    dex: 'CoinGecko',
                    tokenPair: 'SOL/USD',
                    price: solPrice,
                    timestamp,
                    source: 'CoinGecko API'
                });
            }

            this.logger.log(`Found ${prices.length} CoinGecko price(s)`);
            return prices;
        } catch (error) {
            this.logger.error('Failed to fetch CoinGecko prices:', error.message);
            return [];
        }
    }

    private logPrices(prices: PriceData[], profitThreshold: number): void {
        this.logger.log('='.repeat(80));
        this.logger.log('ARBITRAGE PRICE ANALYSIS');
        this.logger.log('='.repeat(80));
        this.logger.log(`Timestamp: ${new Date().toISOString()}`);
        this.logger.log(`Profit Threshold: ${profitThreshold}%`);
        this.logger.log('');

        // Group prices by token pair
        const pricesByPair = prices.reduce((acc, price) => {
            if (!acc[price.tokenPair]) {
                acc[price.tokenPair] = [];
            }
            acc[price.tokenPair].push(price);
            return acc;
        }, {} as Record<string, PriceData[]>);

        // Log prices for each token pair
        Object.entries(pricesByPair).forEach(([pair, pairPrices]) => {
            this.logger.log(`${pair} Prices:`);
            this.logger.log('-'.repeat(40));

            pairPrices.forEach(price => {
                this.logger.log(`${price.dex.padEnd(10)} | ${price.price.toFixed(6).padStart(12)} | ${price.source}`);
            });

            // Calculate arbitrage opportunity
            if (pairPrices.length >= 2) {
                const sortedPrices = pairPrices.sort((a, b) => a.price - b.price);
                const lowest = sortedPrices[0];
                const highest = sortedPrices[sortedPrices.length - 1];
                const priceDiff = highest.price - lowest.price;
                const profitPercent = (priceDiff / lowest.price) * 100;

                this.logger.log('');
                this.logger.log(`Arbitrage Analysis:`);
                this.logger.log(`  Lowest:  ${lowest.dex} at ${lowest.price.toFixed(6)}`);
                this.logger.log(`  Highest: ${highest.dex} at ${highest.price.toFixed(6)}`);
                this.logger.log(`  Price Diff: ${priceDiff.toFixed(6)} (${profitPercent.toFixed(2)}%)`);

                // Calculate potential profit for 1 SOL
                const potentialProfit = priceDiff;
                const potentialProfitPercent = profitPercent;

                this.logger.log(`  Potential Profit: ${potentialProfit.toFixed(6)} SOL per 1 SOL traded`);
                this.logger.log(`  Potential Profit: $${(potentialProfit * lowest.price).toFixed(2)} per $${lowest.price.toFixed(2)} traded`);

                if (profitPercent >= profitThreshold) {
                    this.logger.log(`  ✅ ARBITRAGE OPPORTUNITY FOUND! (${profitPercent.toFixed(2)}% > ${profitThreshold}%)`);
                    this.logger.log(`  💰 Buy on ${lowest.dex}, Sell on ${highest.dex}`);
                } else {
                    this.logger.log(`  ❌ No arbitrage opportunity (${profitPercent.toFixed(2)}% < ${profitThreshold}%)`);
                }
            }

            this.logger.log('');
        });

        this.logger.log('='.repeat(80));
    }
}
