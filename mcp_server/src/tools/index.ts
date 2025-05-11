import { registerBankTools } from './bank';
import { registerCryptoTools } from './crypto';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerAllTools(server: McpServer) {
  registerBankTools(server);
  registerCryptoTools(server);
} 