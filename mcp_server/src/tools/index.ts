import { registerBankTools } from './bank';
import { registerCryptoTools } from './crypto';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLifiTools } from './lifi';

export function registerAllTools(server: McpServer) {
  registerBankTools(server);
  registerCryptoTools(server);
  registerLifiTools(server);
} 