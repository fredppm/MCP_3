import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export class MCPClient {
  constructor(version = '1.0') {
    this.version = version;
    this.client = null;
    this.transport = null;
    this.connected = false;
    
    // Configure based on version
    this.config = this.getVersionConfig(version);
  }

  getVersionConfig(version) {
    const configs = {
      '1.0': {
        name: 'agent-client-v1.0',
        version: '1.0.0',
        mcpUrl: 'http://localhost:4002/mcp',
        toolName: 'sum',
        description: 'Sum two numbers (A + B)'
      },
      '1.1': {
        name: 'agent-client-v1.1',
        version: '1.1.0',
        mcpUrl: 'http://localhost:4003/mcp',
        toolName: 'sum',
        description: 'Sum three numbers (A + B + C)'
      }
    };

    return configs[version] || configs['1.0'];
  }

  async connect() {
    if (this.connected) {
      return true;
    }

    try {
      this.client = new Client(
        {
          name: this.config.name,
          version: this.config.version
        },
        {
          capabilities: {}
        }
      );

      this.transport = new StreamableHTTPClientTransport(
        new URL(this.config.mcpUrl)
      );

      await this.client.connect(this.transport);
      this.connected = true;
      
      console.log(`✅ Connected to MCP ${this.version}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to MCP ${this.version}:`, error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      try {
        await this.client.close();
        this.connected = false;
        console.log(`🔌 Disconnected from MCP ${this.version}`);
      } catch (error) {
        console.error(`Error disconnecting from MCP ${this.version}:`, error.message);
      }
    }
  }

  async listTools() {
    if (!this.connected) {
      throw new Error(`Not connected to MCP ${this.version}`);
    }

    try {
      const result = await this.client.listTools();
      return result;
    } catch (error) {
      throw new Error(`Failed to list tools from MCP ${this.version}: ${error.message}`);
    }
  }

  async callTool(name, args) {
    if (!this.connected) {
      throw new Error(`Not connected to MCP ${this.version}`);
    }

    try {
      const result = await this.client.callTool({
        name,
        arguments: args
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to call tool ${name} on MCP ${this.version}: ${error.message}`);
    }
  }

  async sum(params) {
    const toolName = this.config.toolName;
    
    if (this.version === '1.0') {
      if (!params.a || !params.b) {
        throw new Error('MCP v1.0 requires parameters a and b');
      }
      return await this.callTool(toolName, { a: params.a, b: params.b });
    } else if (this.version === '1.1') {
      if (!params.a || !params.b || !params.c) {
        throw new Error('MCP v1.1 requires parameters a, b, and c');
      }
      return await this.callTool(toolName, { a: params.a, b: params.b, c: params.c });
    }
  }

  getToolDescription() {
    return `${this.config.description} (MCP v${this.version})`;
  }
}