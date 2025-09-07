import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export function createMCPClient() {
  const url = process.env.MCP_URL || "http://localhost:4002/mcp";
  const headers: Record<string, string> = {};
  const token = process.env.MCP_AUTH_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const client = new MultiServerMCPClient({
    useStandardContentBlocks: true,
    mcpServers: {
      local: {
        transport: "http",
        url,
        headers
      }
    }
  });

  return client;
}