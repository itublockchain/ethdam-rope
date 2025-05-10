import { Router } from 'express';
import WalletController from '../controllers/wallet.controller';

const router = Router();
const walletController = new WalletController();

router.get('/wallet-address', walletController.getWalletAddress);

// İşlem doğrulama endpoint'i
router.post('/execute-transaction', walletController.executeTransaction);

// Cüzdan adresi doğrulama endpoint'i
router.post('/validate-address', walletController.validateAddress);

export default router; 