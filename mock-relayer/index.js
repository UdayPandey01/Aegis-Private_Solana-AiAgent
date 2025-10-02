// filename: mock-relayer/index.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'http://localhost:8899';

app.post('/api/v1/bundles', async (req, res) => {
    console.log('Mock Relayer received a bundle submission:');
    const transaction = req.body.params[0][0]; // Extract the first transaction from the bundle

    try {
        const rpcResponse = await axios.post(SOLANA_RPC_URL, {
            jsonrpc: '2.0',
            id: 1,
            method: 'sendTransaction',
            params: [
                transaction,
                {
                    encoding: 'base64',
                    skipPreflight: true,
                },
            ],
        });

        console.log('Forwarded transaction to validator, signature:', rpcResponse.data.result);
        res.json({ jsonrpc: '2.0', id: 1, result: rpcResponse.data.result });

    } catch (error) {
        console.error('Error forwarding transaction:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to forward transaction' });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Mock Jito Relayer listening on port ${PORT}`);
});