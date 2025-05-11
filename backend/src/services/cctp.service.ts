import axios from "axios";
import { http, encodeFunctionData, createWalletClient, WalletClient, Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, avalancheFuji, arbitrumSepolia, baseSepolia, lineaSepolia } from "viem/chains";
import dotenv from 'dotenv';

dotenv.config();

export class CctpService {

    getMessageTransmitter(chain: string) {
        switch (chain) {
            case 'avalanche':
                return "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`
            case 'linea':
                return "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`
            case 'arbitrum':
                return "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`
            case 'base':
                return "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`
            default:
                throw new Error(`Unsupported chain: ${chain}`)
        }
    }

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

    getTokenMessenger(chain: string) {
        switch (chain) {
            case 'sepolia':
                return "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as `0x${string}`
            default:
                throw new Error(`Unsupported chain: ${chain}`)
        }
    }

    getDomain(chain: string) {
        switch (chain) {
            case 'sepolia':
                return 0
            case 'avalanche':
                return 1
            case 'arbitrum':
                return 3
            case 'base':
                return 6
            case 'linea':
                return 11
            default:
                throw new Error(`Unsupported chain: ${chain}`)
        }
    }
    
    // Transfer Parameters
    private DESTINATION_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}` // Address to receive minted tokens on destination chain

    // Bytes32 Formatted Parameters
    private DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${this.DESTINATION_ADDRESS.slice(2)}` as `0x${string}` // Destination address in bytes32 format
    private DESTINATION_CALLER_BYTES32 =
    '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}` // Empty bytes32 allows any address to call MessageTransmitterV2.receiveMessage()

    
    async approveUSDC() {
        const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
        // Set up the wallet clients
        const sepoliaClient = createWalletClient({
            chain: sepolia,
            transport: http(),
            account,
        })
        
        const avalancheClient = createWalletClient({
            chain: avalancheFuji,
            transport: http(),
            account,
        })

        console.log('Approving USDC transfer...')
        const approveTx = await sepoliaClient.sendTransaction({
          to: this.getUSDC('sepolia'),
          data: encodeFunctionData({
            abi: [
              {
                type: 'function',
                name: 'approve',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ name: '', type: 'bool' }],
              },
            ],
            functionName: 'approve',
            args: [this.getTokenMessenger('sepolia'), BigInt('1000000000000')], 
          }),
        })
        console.log(`USDC Approval Tx: ${approveTx}`)
    }

    async burnUSDC(amount: number, chain: string) {
        const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
        // Set up the wallet clients
        const sepoliaClient = createWalletClient({
            chain: sepolia,
            transport: http(),
            account,
        })
        console.log('Burning USDC on Ethereum Sepolia...')
        const burnTx = await sepoliaClient.sendTransaction({
          to: this.getTokenMessenger('sepolia'),
          data: encodeFunctionData({
            abi: [
              {
                type: 'function',
                name: 'depositForBurn',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'amount', type: 'uint256' },
                  { name: 'destinationDomain', type: 'uint32' },
                  { name: 'mintRecipient', type: 'bytes32' },
                  { name: 'burnToken', type: 'address' },
                  { name: 'destinationCaller', type: 'bytes32' },
                  { name: 'maxFee', type: 'uint256' },
                  { name: 'minFinalityThreshold', type: 'uint32' },
                ],
                outputs: [],
              },
            ],
            functionName: 'depositForBurn',
            args: [
              BigInt(amount),
              this.getDomain(chain),
              this.DESTINATION_ADDRESS_BYTES32,
              this.getUSDC('sepolia'),
              this.DESTINATION_CALLER_BYTES32,
              BigInt('5000'),
              1000, // minFinalityThreshold (1000 or less for Fast Transfer)
            ],
          }),
        })
        console.log(`Burn Tx: ${burnTx}`)
        return burnTx
    }   

    async retrieveAttestation(transactionHash: string) {
        console.log('Retrieving attestation...')
        const url = `https://iris-api-sandbox.circle.com/v2/messages/${this.getDomain('sepolia')}?transactionHash=${transactionHash}`
        while (true) {
          try {
            const response = await axios.get(url)
            console.log(response.data)
            if (response.status === 404) {
              console.log('Waiting for attestation...')
            }
            if (response.data?.messages?.[0]?.status === 'complete') {
              console.log('Attestation retrieved successfully!')
              return response.data.messages[0]
            }
            console.log('Waiting for attestation...')
            await new Promise((resolve) => setTimeout(resolve, 5000))
          } catch (error: any) {
            console.error('Error fetching attestation:', error.message)
            await new Promise((resolve) => setTimeout(resolve, 5000))
          }
        }
    }
      
    async mintUSDC(attestation: any, chain: string) {
        const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
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
            default:
                throw new Error(`Unsupported chain: ${chain}`)
        }
        const client = createWalletClient({
            chain: clientChain,
            transport: http(),
            account,
        })
        console.log(`Minting USDC on ${chain}...`)
        const mintTx = await client.sendTransaction({
          to: this.getMessageTransmitter(chain),
          data: encodeFunctionData({
            abi: [
              {
                type: 'function',
                name: 'receiveMessage',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'message', type: 'bytes' },
                  { name: 'attestation', type: 'bytes' },
                ],
                outputs: [],
              },
            ],
            functionName: 'receiveMessage',
            args: [attestation.message, attestation.attestation],
          }),
        })
        console.log(`Mint Tx: ${mintTx}`)
    }
}