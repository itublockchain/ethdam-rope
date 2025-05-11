import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from 'axios';
import { config } from '../config';

export function registerCryptoTools(server: McpServer) {
  server.tool("get-crypto-info",
    "Gives crypto wallet information for selling crypto to fiat",
    async () => {
      const response = await axios.get(`${config.API_BASE_URL}/wallet/wallet-address`);
      return {
        content: [
          {
            type: "text",
            text: `Crypto wallet address: ${response.data.walletAddress}`
          }
        ]
      };
    }
  );

  server.tool(
    "buy-crypto-with-fiat",
    "Convert fiat currency to cryptocurrency by verifying bank transfer and sending crypto",
    {
      amount: z.number().positive().describe("Amount in USD to convert to cryptocurrency"),
      bankAccountNumber: z.string().describe("Bank account number where fiat transfer was made from. Important: It is from user."),
      walletAddress: z.string().describe("Blockchain wallet address to receive the cryptocurrency"),
      chain: z.string().describe("Blockchain chain to send the usdc to. Options: base, arbitrum, avalanche, linea, sepolia")
    },
    async ({ amount, bankAccountNumber, walletAddress, chain }) => {
      try {
        const transferResponse = await axios.post(`${config.API_BASE_URL}/bank/execute-transaction`, {
          amount, 
          bankAccountNumber, 
          walletAddress,
          chain
        });

        if (!transferResponse.data.success) {
          return {
            content: [
              {
                type: "text",
                text: transferResponse.data.error,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Transaction complete! ${amount} USD converted to crypto and sent to ${walletAddress}.\nTransaction hash: ${transferResponse.data.transactionHash}`,
            },
          ],
        };

      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "validate-wallet-address",
    "Check if a wallet address is valid",
    {
      walletAddress: z.string().describe("Blockchain wallet address to validate")
    },
    async ({ walletAddress }) => {
      try {
        const response = await axios.post(`${config.API_BASE_URL}/wallet/validate-address`, {
          walletAddress
        });
        
        return {
          content: [
            {
              type: "text",
              text: response.data.isValid 
                ? `The address ${walletAddress} is a valid Ethereum address format.`
                : `The address ${walletAddress} is not a valid Ethereum address format.`
            }
          ],
          isError: !response.data.isValid
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while validating the wallet address`
            }
          ],
          isError: true
        };
      }
    }
  );
} 