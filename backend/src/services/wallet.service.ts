import { createPublicClient, createWalletClient, http, parseUnits, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { TransactionRequest } from '../types/mcp.types';
import BankService from './bank.service';
import dotenv from 'dotenv';

dotenv.config();

export class WalletService {
    // Private key olarak tanımlanıyor
    private PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
    private WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;


    public async getWalletAddress(): Promise<any> {
        return {
            walletAddress: this.WALLET_ADDRESS
        }
    }

    /**
     * İşlemin geçerli olup olmadığını kontrol eder
     * @param transactionRequest İşlem bilgileri
     * @returns {Promise<boolean>} İşlemin geçerliliği
     */
    async executeTransaction(transactionRequest: TransactionRequest): Promise<any> {
        try {
            // Cüzdan adresi doğrulama
            if (!this.isWalletAddressValid(transactionRequest.walletAddress)) {
                return {
                    success: false,
                    message: "Invalid wallet address"
                }
            }

            // USDC kontrat adresi (Sepolia)
            const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`;
            
            // Public client oluştur
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http()
            });

            const contract = getContract({
                address: usdcAddress,
                abi: this.usdcAbi,
                client: { public: publicClient }
            });

            const decimals = await contract.read.decimals();
            
            const expectedAmount = parseUnits(transactionRequest.amount.toString(), decimals);

            const currentBlock = await publicClient.getBlockNumber();
            const fromBlock = currentBlock - BigInt(100);

            const transferEvents = await publicClient.getLogs({
                address: usdcAddress,
                event: {
                    type: 'event',
                    name: 'Transfer',
                    inputs: [
                        { type: 'address', name: 'from', indexed: true },
                        { type: 'address', name: 'to', indexed: true },
                        { type: 'uint256', name: 'value', indexed: false }
                    ]
                },
                fromBlock,
                toBlock: currentBlock
            });

            // İstenen cüzdan adresinden gelen ve doğru miktarda olan transferleri bul
            const matchingTransfers = transferEvents.filter(event => {
                const fromAddress = event.args.from?.toLowerCase();
                const amount = event.args.value;
                return fromAddress === transactionRequest.walletAddress.toLowerCase() && 
                       amount === expectedAmount;
            });

            if (matchingTransfers.length > 0) {

                const bankService = new BankService();
                const bankResponse = await bankService.sendMoney({
                    destination: {
                        type: "SCAN",
                        accountNumber: transactionRequest.bankAccountNumber,
                        sortCode: transactionRequest.sortCode || "",
                        name: transactionRequest.name || ""
                    },
                    amount: transactionRequest.amount,
                    reference: "Crypto to fiat"
                });
                
                if (bankResponse.status) {
                    return {
                        success: true,
                        message: "Transaction verified and bank transfer successful"
                    }
                } else {
                    return {
                        success: false,
                        message: "Transaction verified but bank transfer failed"
                    }
                }
            } 
            return {
                success: false,
                message: "Transaction not verified"
            }
            
        } catch (error) {
            console.log(error);
            return {
                success: false,
                message: "Verification error"
            }
        }
    }

    /**
     * Cüzdan adresinin geçerli olup olmadığını kontrol eder
     * @param walletAddress Kontrol edilecek cüzdan adresi
     * @returns {boolean} Adresin geçerliliği
     */
    isWalletAddressValid(walletAddress: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    }

    /**
     * USDC token için ABI tanımı
     */
    private usdcAbi = [
        {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
        },
        {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'owner', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
        },
        {
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'uint8' }]
        }
    ] as const;

    /**
     * Belirtilen adrese USDC gönderir (Sepolia testnet üzerinde)
     * @param {string} toAddress Alıcı Ethereum adresi
     * @param {number} amount Gönderilecek USDC miktarı
     * @returns {Promise<`0x${string}`>} İşlem hash'i
     * @throws {Error} Geçersiz cüzdan adresi veya işlem hatası durumunda
     */
    async send(
        toAddress: string,
        amount: number
    ): Promise<`0x${string}`> {
        try {
            // Cüzdan adresi doğrulama
            if (!this.isWalletAddressValid(toAddress)) {
                throw new Error('Geçersiz cüzdan adresi formatı');
            }

            // USDC kontrat adresi (Sepolia)
            const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`;
            
            // Hesabı oluştur
            const account = privateKeyToAccount(this.PRIVATE_KEY);
            
            // Public client oluştur
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http()
            });
            
            // Wallet client oluştur
            const walletClient = createWalletClient({
                account,
                chain: sepolia,
                transport: http()
            });
            
            // USDC kontratı oluştur
            const contract = getContract({
                address: usdcAddress,
                abi: this.usdcAbi,
                client: { public: publicClient, wallet: walletClient }
            });
            
            // USDC'nin ondalık basamak sayısını al
            const decimals = await contract.read.decimals();
            
            // Miktarı doğru formata çevir
            const amountInWei = parseUnits(amount.toString(), decimals);
            
            console.log(`${amount} USDC gönderiliyor: ${account.address} adresinden ${toAddress} adresine`);
            
            // USDC transfer işlemini gerçekleştir
            const hash = await contract.write.transfer([
                toAddress as `0x${string}`,
                amountInWei
            ]);
            
            return hash;
        } catch (error) {
            console.error("USDC transfer hatası:", error);
            throw error;
        }
    }
}