import { Request, Response } from 'express';
import BankService from '../services/bank.service';
import { CreatePaymentRequest } from '../types/bank.types';
import { TransactionRequest } from '../types/mcp.types';

export class BankController {
    private bankService: BankService;

    constructor() {
        this.bankService = new BankService();
    }

    public getBankAccountInfo = async (req: Request, res: Response): Promise<void> => {
        try {
            const bankAccountInfo = await this.bankService.getBankAccountInfo();
            res.status(200).json(bankAccountInfo);
        } catch (error) {
            console.error('Bank account info not found:', error);
            res.status(500).json({ 
                error: 'Bank account info not found',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    public sendMoney = async (req: Request, res: Response): Promise<void> => {
        try {
            const paymentRequest: CreatePaymentRequest = req.body;
            const result = await this.bankService.sendMoney(paymentRequest);
            res.status(200).json(result);
        } catch (error) {
            console.error('Money sending error:', error);
            res.status(500).json({ 
                error: 'Money sending error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    public executeTransaction = async (req: Request, res: Response): Promise<void> => {
        try {
            const transactionRequest: TransactionRequest = req.body;
            const result = await this.bankService.executeTransaction(transactionRequest);
            res.status(200).json(result);
        } catch (error) {
            console.error('Transaction validation error:', error);
            res.status(500).json({ 
                error: 'Transaction validation error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default BankController;
