import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from './config';
import { registerAllTools } from './tools';

// Create server instance
const server = new McpServer({
    name: config.SERVER_NAME,
    version: config.SERVER_VERSION,
    capabilities: {
      resources: {},
      tools: {},
    },
});

// Tüm araçları kaydet
registerAllTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 