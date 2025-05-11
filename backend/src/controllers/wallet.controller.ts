import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { TransactionRequest } from '../types/mcp.types';

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
    }

    public getWalletAddress = async (req: Request, res: Response): Promise<void> => {
        try {
            const walletAddress = await this.walletService.getWalletAddress();
            res.status(200).json(walletAddress);
        } catch (error) {
            console.error('Wallet address not found:', error);
            res.status(500).json({ 
                error: 'Wallet address not found',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    public sendUSDC = async (req: Request, res: Response): Promise<void> => {
        try {
            const { toAddress, amount, chain } = req.body;
            
            if (!toAddress || !amount) {
                res.status(400).json({ 
                    error: 'Geçersiz istek',
                    details: 'toAddress ve amount alanları gereklidir'
                });
                return;
            }

            const hash = await this.walletService.send(toAddress, amount, chain);
            res.status(200).json({ 
                success: true,
                transactionHash: hash
            });
        } catch (error) {
            console.error('USDC gönderme hatası:', error);
            res.status(500).json({ 
                error: 'USDC gönderme işlemi sırasında bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            });
        }
    }

    public executeTransaction = async (req: Request, res: Response): Promise<void> => {
        try {
            const transactionRequest: TransactionRequest = req.body;
            const result = await this.walletService.executeTransaction(transactionRequest);
            res.status(200).json(result);
        } catch (error) {
            console.error('İşlem doğrulama hatası:', error);
            res.status(500).json({ 
                error: 'İşlem doğrulama sırasında bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            });
        }
    }

    public validateAddress = async (req: Request, res: Response): Promise<void> => {
        try {
            const { walletAddress } = req.body;
            
            if (!walletAddress) {
                res.status(400).json({ 
                    error: 'Geçersiz istek',
                    details: 'walletAddress alanı gereklidir'
                });
                return;
            }

            const isValid = this.walletService.isWalletAddressValid(walletAddress);
            res.status(200).json({ isValid });
        } catch (error) {
            console.error('Cüzdan adresi doğrulama hatası:', error);
            res.status(500).json({ 
                error: 'Cüzdan adresi doğrulama sırasında bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            });
        }
    }
}

export default WalletController;
