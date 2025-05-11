import { createPublicClient, createWalletClient, http, parseUnits, getContract, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, avalancheFuji, arbitrumSepolia, baseSepolia, lineaSepolia } from 'viem/chains';
import { TransactionRequest } from '../types/mcp.types';
import BankService from './bank.service';
import dotenv from 'dotenv';

dotenv.config();

export class WalletService {

    private PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
    private WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;

    getUSDC(chain: string) {
        switch (chain) {
            case 'sepolia':
                return "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238" as `0x${string}`
            case 'avalanche':
                return "0x5425890298aed601595a70AB815c96711a31Bc65" as `0x${string}`
            case 'arbitrum':
                return "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`
            case 'base':
                return "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`
            case 'linea':
                return "0xFEce4462D57bD51A6A552365A011b95f0E16d9B7" as `0x${string}`
            default:
                throw new Error(`Unsupported chain: ${chain}`)
        }
    }


    public async getWalletAddress(): Promise<any> {
        return {
            walletAddress: this.WALLET_ADDRESS
        }
    }

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

    isWalletAddressValid(walletAddress: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    }

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

    async send(
        toAddress: string,
        amount: number,
        chain: string
    ): Promise<`0x${string}`> {
        try {
            // Cüzdan adresi doğrulama
            if (!this.isWalletAddressValid(toAddress)) {
                throw new Error('Geçersiz cüzdan adresi formatı');
            }
            
            // Hesabı oluştur
            const account = privateKeyToAccount(this.PRIVATE_KEY);

            let clientChain: Chain
            switch (chain) {
                case 'sepolia':
                    clientChain = sepolia
                    break
                case 'avalanche':
                    clientChain = avalancheFuji
                    break
                case 'arbitrum':
                    clientChain = arbitrumSepolia
                    break
                case 'base':
                    clientChain = baseSepolia
                    break
                case 'linea':
                    clientChain = lineaSepolia
                    break       
                default:
                    throw new Error(`Unsupported chain: ${chain}`)
            }
            
            const publicClient = createPublicClient({
                chain: clientChain,
                transport: http()
            });
            
            const walletClient = createWalletClient({
                account,
                chain: clientChain,
                transport: http()
            });
            
            const contract = getContract({
                address: this.getUSDC(chain),
                abi: this.usdcAbi,
                client: { public: publicClient, wallet: walletClient }
            });
            
            // USDC'nin ondalık basamak sayısını al
            const decimals = await contract.read.decimals();
            
            // Miktarı doğru formata çevir
            const amountInWei = parseUnits(amount.toString(), decimals);
            
            console.log(`${amount} USDC gönderiliyor: ${account.address} adresinden ${toAddress} adresine`);
            
            // Nonce değerini al
            const nonce = await publicClient.getTransactionCount({
                address: account.address,
            });
            
            // Gas fiyatını hesapla (mevcut fiyatın %20 üzerine çıkar)
            const gasPrice = await publicClient.getGasPrice();
            const increasedGasPrice = gasPrice * BigInt(120) / BigInt(100); // %20 artış
            
            // USDC transfer işlemini gerçekleştir
            const hash = await contract.write.transfer(
                [toAddress as `0x${string}`, amountInWei],
                {
                    nonce: nonce,
                    gasPrice: increasedGasPrice,
                    maxPriorityFeePerGas: undefined, // Type-2 işlemleri için uyumluluk
                    maxFeePerGas: undefined,        // Type-2 işlemleri için uyumluluk
                }
            );
            
            return hash;
        } catch (error) {
            console.error("USDC transfer hatası:", error);
            throw error;
        }
    }
}