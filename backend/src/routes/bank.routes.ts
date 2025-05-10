import { Router } from 'express';
import BankController from '../controllers/bank.controller';

const router = Router();
const bankController = new BankController();

router.get('/bank-account-info', bankController.getBankAccountInfo);
router.post('/execute-transaction', bankController.executeTransaction);

export default router; 