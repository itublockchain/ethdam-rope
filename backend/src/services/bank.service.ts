import { TransactionRequest } from '../types/mcp.types';
import axios from 'axios';
import { Signature } from '../helpers/signature';
import { CreatePaymentRequest, CreatePaymentResponse, Response, Transaction } from '../types/bank.types';
import { WalletService } from './wallet.service';
import dotenv from 'dotenv';
import { CctpService } from './cctp.service';

dotenv.config();

export class BankService {

    private apiKey = process.env.BANK_API_KEY as string;
    private apiSecret = process.env.BANK_API_SECRET as string;

    public async getBankAccountInfo(): Promise<any> {
        return {
            bankAccountNumber: "04685798",
            bankAccountName: "Yasir Kilinc",
            bankAccountCurrency: "GBP",
            bankSortCode: "00-00-00"
        }
    }

    public async sendMoney(createPaymentRequest: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        try {
            const signatureHelper = new Signature(this.apiKey,this.apiSecret);
            const signatureResult = signatureHelper.calculate();
            const headers = signatureResult.getHTTPHeaders();
            
            createPaymentRequest.sourceAccountId = createPaymentRequest.sourceAccountId || "A2100DV5R6";
            createPaymentRequest.currency = createPaymentRequest.currency || "GBP";

            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `https://api-sandbox.modulrfinance.com/api-sandbox/payments`,
                headers: headers,
                data: createPaymentRequest
            };

            const response = await axios.request(config);
            return response.data;
            
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error('API Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            } else {
                console.error('Beklenmeyen hata:', error);
            }
            throw error;
        }
    }

    public async executeTransaction(transactionRequest: TransactionRequest): Promise<any> {
        try {    
            const transactions = await this.getTransactions();
            const filteredTransactions: Transaction[] = []

            for (const transaction of transactions.content) {
                try {
                    if (transaction.additionalInfo.payer.identifier.accountNumber === transactionRequest.bankAccountNumber) {
                        filteredTransactions.push(transaction);
                        break;
                    }
                } catch (error) {
                    console.log(transaction);
                    console.error('Unexpected error:', error);
                }
            }
            if (filteredTransactions[0].amount === transactionRequest.amount) {
                const walletService = new WalletService();
                const cctpService = new CctpService();
                try {
                    if (transactionRequest.chain !== 'sepolia') {
                        const burnTx = await cctpService.burnUSDC(transactionRequest.amount * 10 ** 6, transactionRequest.chain as string);
                        const attestation = await cctpService.retrieveAttestation(burnTx);
                        const mintTx = await cctpService.mintUSDC(attestation, transactionRequest.chain as string);
                    } 

                    const hash = await walletService.send(transactionRequest.walletAddress, transactionRequest.amount, transactionRequest.chain as string);
                    
                    return {
                        success: true,
                        transactionHash: hash
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: "Unexpected error"
                    };
                }
            }
            return {
                success: false,
                error: "Transaction amount does not match"
            };
        } catch (error) {
            console.error('Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error"
            };
        }
    }

    private async getTransactions(): Promise<Response<Transaction[]>> {
        try {
            const signatureHelper = new Signature(this.apiKey,this.apiSecret);
            const signatureResult = signatureHelper.calculate();
            const headers = signatureResult.getHTTPHeaders();
            const config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api-sandbox.modulrfinance.com/api-sandbox/accounts/A2100DV5R6/transactions`,
                headers: headers
            };

            const response = await axios.request(config);
            return response.data;
        } catch (error) {
            console.error('İşlemler alınırken hata oluştu:', error);
            throw error;
        }
    }
}

export default BankService;