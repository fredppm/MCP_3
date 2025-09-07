import { BedrockClient } from './bedrock-client.js';
import { MCPClient } from './mcp-client.js';
import readline from 'readline';

export class MCPAgent {
  constructor(options = {}) {
    this.bedrock = new BedrockClient({
      region: options.region,
      modelId: options.modelId
    });
    
    this.mcpV1 = new MCPClient('1.0');
    this.mcpV11 = new MCPClient('1.1');
    
    this.systemPrompt = this.buildSystemPrompt();
    this.conversationHistory = [];
  }

  buildSystemPrompt() {
    return `You are an AI agent with access to MCP (Model Context Protocol) tools for mathematical operations.

Available tools:
- MCP v1.0: Sum two numbers (a + b)
- MCP v1.1: Sum three numbers (a + b + c)

When users ask for mathematical operations:
1. Determine which MCP version is appropriate based on the number of parameters
2. Use the appropriate MCP client to perform the calculation
3. Return the result in a clear format

If a user provides 2 numbers, use MCP v1.0.
If a user provides 3 numbers, use MCP v1.1.
If the numbers don't match the available operations, explain the limitation.

Always be helpful and explain what you're doing when using MCP tools.`;
  }

  async initialize() {
    console.log('🚀 Initializing MCP Agent...');
    
    // Connect to both MCP versions
    const v1Connected = await this.mcpV1.connect();
    const v11Connected = await this.mcpV11.connect();
    
    if (!v1Connected && !v11Connected) {
      throw new Error('Failed to connect to any MCP servers. Make sure MCP servers are running.');
    }
    
    if (!v1Connected) {
      console.log('⚠️ MCP v1.0 not available');
    }
    
    if (!v11Connected) {
      console.log('⚠️ MCP v1.1 not available');
    }
    
    console.log('✅ MCP Agent initialized successfully');
  }

  async processUserInput(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Analyze if the user is asking for mathematical operations
      const mathRequest = this.analyzeMathRequest(userMessage);
      
      let response;
      if (mathRequest) {
        response = await this.handleMathRequest(mathRequest, userMessage);
      } else {
        // Regular chat with Bedrock
        response = await this.chatWithBedrock(userMessage);
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      return response;
    } catch (error) {
      const errorMsg = `❌ Error processing request: ${error.message}`;
      console.error(errorMsg);
      return errorMsg;
    }
  }

  analyzeMathRequest(message) {
    // Simple regex to detect math requests with numbers
    const patterns = [
      /sum\s+(\d+(?:\.\d+)?)\s+(?:and\s+)?(\d+(?:\.\d+)?)\s*$/i,
      /sum\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*$/i,
      /sum\s+(\d+(?:\.\d+)?)\s+(?:and\s+)?(\d+(?:\.\d+)?)\s+(?:and\s+)?(\d+(?:\.\d+)?)\s*$/i,
      /sum\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*$/i,
      /(?:add|calculate)\s+(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*$/i,
      /(?:add|calculate)\s+(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*$/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const numbers = match.slice(1).filter(n => n !== undefined).map(n => parseFloat(n));
        return {
          numbers,
          operation: 'sum'
        };
      }
    }

    return null;
  }

  async handleMathRequest(mathRequest, originalMessage) {
    const { numbers, operation } = mathRequest;
    
    try {
      let result;
      let usedVersion;

      if (numbers.length === 2) {
        // Use MCP v1.0
        if (!this.mcpV1.connected) {
          return "❌ MCP v1.0 is not available. Cannot perform 2-number sum.";
        }
        
        result = await this.mcpV1.sum({ a: numbers[0], b: numbers[1] });
        usedVersion = "v1.0";
      } else if (numbers.length === 3) {
        // Use MCP v1.1
        if (!this.mcpV11.connected) {
          return "❌ MCP v1.1 is not available. Cannot perform 3-number sum.";
        }
        
        result = await this.mcpV11.sum({ a: numbers[0], b: numbers[1], c: numbers[2] });
        usedVersion = "v1.1";
      } else {
        return `❌ I can only sum 2 numbers (using MCP v1.0) or 3 numbers (using MCP v1.1). You provided ${numbers.length} numbers.`;
      }

      if (result.content && result.content[0] && result.content[0].text) {
        const mcpResponse = JSON.parse(result.content[0].text);
        return `✅ Using MCP ${usedVersion}: ${mcpResponse.result} (${mcpResponse.operation})`;
      } else {
        return `❌ Unexpected response format from MCP ${usedVersion}`;
      }
    } catch (error) {
      return `❌ Error using MCP tools: ${error.message}`;
    }
  }

  async chatWithBedrock(message) {
    const messages = [
      { role: 'user', content: this.systemPrompt },
      ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await this.bedrock.chat(messages, {
      maxTokens: 500,
      temperature: 0.7
    });

    if (response.success) {
      return response.content;
    } else {
      return `❌ Bedrock error: ${response.error}`;
    }
  }

  async shutdown() {
    console.log('🔄 Shutting down MCP Agent...');
    await this.mcpV1.disconnect();
    await this.mcpV11.disconnect();
    console.log('👋 MCP Agent shutdown complete');
  }
}

// CLI Interface
async function startCLI() {
  const agent = new MCPAgent();
  
  try {
    await agent.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize agent:', error.message);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 MCP Agent is ready!');
  console.log('Examples:');
  console.log('  - "sum 5 and 10" (uses MCP v1.0)');
  console.log('  - "sum 1, 2, 3" (uses MCP v1.1)');
  console.log('  - "Hello!" (regular chat)');
  console.log('  - Type "quit" to exit\n');

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase().trim() === 'quit') {
        await agent.shutdown();
        rl.close();
        process.exit(0);
      }

      const response = await agent.processUserInput(input);
      console.log(`Agent: ${response}\n`);
      
      askQuestion();
    });
  };

  askQuestion();

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n\n🔄 Shutting down...');
    await agent.shutdown();
    rl.close();
    process.exit(0);
  });
}

// Export for use as module or run as CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  startCLI();
}