const express = require('express');
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');

const app = express();
const port = 3000;

app.use(express.json());

// Connect to Solana cluster
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// API endpoint to get a balance
app.get('/api/balance/:publicKey', async (req, res) => {
    try {
        const publicKey = new PublicKey(req.params.publicKey);
        const balance = await connection.getBalance(publicKey);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
