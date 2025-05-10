import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create server instance
const server = new McpServer({
    name: "rope",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
});

server.tool("get-bank-info",
  "Gives bank account information for buying crypto with fiat",
  async () => {
    const response = await axios.get(`${API_BASE_URL}/bank/bank-account-info`);
    return {
      content: [
        {
          type: "text",
          text: `Bank account number: ${response.data.bankAccountNumber}\nBank account name: ${response.data.bankAccountName}\nBank account currency: ${response.data.bankAccountCurrency}\nBank sort code: ${response.data.bankSortCode}`
        }
      ]
    };
  }
);

server.tool("get-crypto-info",
  "Gives crypto wallet information for selling crypto to fiat",
  async () => {
    const response = await axios.get(`${API_BASE_URL}/wallet/wallet-address`);
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
    walletAddress: z.string().describe("Blockchain wallet address to receive the cryptocurrency")
  },
  async ({ amount, bankAccountNumber, walletAddress }) => {
    try {
      // Banka transferini doğrula
      const transferResponse = await axios.post(`${API_BASE_URL}/bank/execute-transaction`, {
        amount, 
        bankAccountNumber, 
        walletAddress
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
  "sell-crypto-for-fiat",
  "Convert cryptocurrency to fiat currency",
  {
    amount: z.number().positive().describe("Amount of cryptocurrency to convert to USD"),
    bankAccountNumber: z.string().describe("Bank account number to receive the fiat transfer"),
    sortCode: z.string().describe("Bank sort code to receive the fiat transfer"),
    name: z.string().describe("Bank account name to receive the fiat transfer"),
    walletAddress: z.string().describe("Blockchain wallet address to send crypto from")
  },
  async ({ amount, bankAccountNumber, sortCode, name, walletAddress }) => {
    try {
      const response: any = await axios.post(`${API_BASE_URL}/wallet/execute-transaction`, {
        amount,
        bankAccountNumber,
        walletAddress,
        name,
        sortCode
      });

      if (response.data.success) {
        return {
          content: [
            {
              type: "text",
              text: `Transaction completed. ${amount} crypto converted to fiat and sent to ${bankAccountNumber}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: response.data.message,
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
      const response = await axios.post(`${API_BASE_URL}/wallet/validate-address`, {
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
}); 