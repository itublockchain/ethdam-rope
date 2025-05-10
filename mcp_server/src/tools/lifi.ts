import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from 'axios';
import { config } from '../config';

const BASE_URL = "https://li.quest/v1";

export function registerLifiTools(server: McpServer) {
    server.tool(
        "get_avaliable_chains",
        "When user asks for something and you need to get the avaliable chains, use this tool",
        async () => {
            const response = await axios.get(`${BASE_URL}/chains`);
            return {
                content: [
                    {
                        type: "text",
                        text: response.data.chains.map((chain: any) => `id: ${chain.id} - name: ${chain.metamask.chainName} - chainType: ${chain.chainType}`).join("\n")
                    }
                ]
            }
        }
    );

    server.tool(
        "search_tokens",
        "User asks for a token, use this tool to search for it",
        {
            search: z.string().describe("The token to search for, can be a symbol, name or address. Returns symbol, name, address, price and chainId")
        },
        async ({ search }) => {
            const response = await axios.get(`${BASE_URL}/tokens`);
            const tokens: any[] = [];
            
            // Her chain için tokenleri işle
            Object.entries(response.data.tokens).forEach(([chainId, chainTokens]) => {
                (chainTokens as any[]).forEach((token: any) => {
                    // Arama terimini kullanarak filtreleme
                    const searchLower = search.toLowerCase();
                    if (
                        token.name.toLowerCase().includes(searchLower) ||
                        token.symbol.toLowerCase().includes(searchLower) ||
                        token.address.toLowerCase().includes(searchLower)
                    ) {
                        tokens.push({
                            chainId,
                            name: token.name,
                            symbol: token.symbol,
                            address: token.address,
                            decimals: token.decimals,
                            price: token.priceUSD
                        });
                    }
                });
            });
            
            return {
                content: [
                    {
                        type: "text",
                        text: tokens.length > 0 
                            ? tokens.map(token => 
                                `Chain: ${token.chainId}, Name: ${token.name}, Symbol: ${token.symbol}, Address: ${token.address}, Price: ${token.price}`
                              ).join("\n")
                            : "Hiçbir token bulunamadı."
                    }
                ]
            }
        }
    );
}