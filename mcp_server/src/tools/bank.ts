import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from 'axios';
import { config } from '../config';

export function registerBankTools(server: McpServer) {
  server.tool("get-bank-info",
    "Gives bank account information for buying crypto with fiat",
    async () => {
      const response = await axios.get(`${config.API_BASE_URL}/bank/bank-account-info`);
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
        const response: any = await axios.post(`${config.API_BASE_URL}/wallet/execute-transaction`, {
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
} 