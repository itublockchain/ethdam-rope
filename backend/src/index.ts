import express from 'express';
import cors from 'cors';
import bankRoutes from './routes/bank.routes';
import walletRoutes from './routes/wallet.routes';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3001;

//Rofl Key Generation for both enviroments
/*
let PRIVATE_KEY = "";
axios.post('http://localhost:3000/rofl/v1/keys/generate', {
  "key_id": "wallet key",
  "kind": "secp256k1"
}).then((res) => {
  PRIVATE_KEY = res.data.key;
}).catch(err => {
  PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  console.error('Error generating wallet private key:', err);
});


export const WALLET_PRIVATE_KEY = PRIVATE_KEY;
*/


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bank', bankRoutes);
app.use('/api/wallet', walletRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 