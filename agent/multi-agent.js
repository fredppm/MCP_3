import { BedrockClient } from '../bedrock-client.js';
import { MCPClient } from '../mcp-client.js';

export class MultiAgentSystem {
  constructor(options = {}) {
    this.bedrock = new BedrockClient({
      region: options.region,
      modelId: options.modelId
    });
    
    this.mcpV1 = new MCPClient('1.0');
    this.mcpV11 = new MCPClient('1.1');
    
    this.agents = {
      coordinator: new CoordinatorAgent(this.bedrock),
      mathAnalyst: new MathAnalystAgent(this.bedrock),
      mcpExecutor: new MCPExecutorAgent(this.mcpV1, this.mcpV11),
      presenter: new PresenterAgent(this.bedrock)
    };
    
    this.conversationHistory = [];
  }

  async initialize() {
    console.log('🚀 Initializing Multi-Agent System...');
    
    const v1Connected = await this.mcpV1.connect();
    const v11Connected = await this.mcpV11.connect();
    
    if (!v1Connected && !v11Connected) {
      throw new Error('Failed to connect to any MCP servers');
    }
    
    console.log('✅ Multi-Agent System initialized');
    return { v1Connected, v11Connected };
  }

  async processRequest(userMessage) {
    try {
      console.log('\n🎯 Starting multi-agent workflow...');
      
      // Step 1: Coordinator analyzes the request
      const coordination = await this.agents.coordinator.analyze(userMessage);
      console.log(`🤖 Coordinator: ${coordination.decision}`);
      
      if (coordination.requiresMath) {
        // Step 2: Math analyst determines the approach
        const analysis = await this.agents.mathAnalyst.analyze(userMessage);
        console.log(`🔢 Math Analyst: ${analysis.approach}`);
        
        // Step 3: MCP executor performs the calculation
        const execution = await this.agents.mcpExecutor.execute(analysis);
        console.log(`⚡ MCP Executor: ${execution.status}`);
        
        // Step 4: Presenter formats the result
        const presentation = await this.agents.presenter.present(execution, userMessage);
        console.log(`📋 Presenter: Result formatted`);
        
        return presentation.response;
      } else {
        // Direct chat through coordinator
        const response = await this.agents.coordinator.chat(userMessage);
        return response;
      }
    } catch (error) {
      return `❌ Multi-agent system error: ${error.message}`;
    }
  }

  async shutdown() {
    console.log('🔄 Shutting down Multi-Agent System...');
    await this.mcpV1.disconnect();
    await this.mcpV11.disconnect();
    console.log('👋 Multi-Agent System shutdown complete');
  }
}

class CoordinatorAgent {
  constructor(bedrock) {
    this.bedrock = bedrock;
    this.role = "System Coordinator";
  }

  async analyze(message) {
    const prompt = `You are a System Coordinator agent. Analyze this user message and determine if it requires mathematical operations using MCP servers.

User message: "${message}"

Respond with a JSON object containing:
- requiresMath: boolean (true if math operation needed)
- decision: string (brief explanation of your decision)

Examples:
- "sum 5 and 10" -> {"requiresMath": true, "decision": "Mathematical sum operation detected"}
- "hello how are you" -> {"requiresMath": false, "decision": "General conversation, no math needed"}`;

    const response = await this.bedrock.invokeModel(prompt, { maxTokens: 200 });
    
    if (response.success) {
      try {
        const result = JSON.parse(response.content);
        return result;
      } catch {
        return {
          requiresMath: message.toLowerCase().includes('sum') || /\d+/.test(message),
          decision: "Fallback analysis based on keywords"
        };
      }
    } else {
      return {
        requiresMath: message.toLowerCase().includes('sum') || /\d+/.test(message),
        decision: "Fallback analysis - Bedrock unavailable"
      };
    }
  }

  async chat(message) {
    const prompt = `You are a helpful AI assistant. The user said: "${message}"

Respond in a friendly and helpful manner.`;

    const response = await this.bedrock.invokeModel(prompt, { maxTokens: 300 });
    
    if (response.success) {
      return response.content;
    } else {
      return "I'm having trouble connecting to my language model. Please try again.";
    }
  }
}

class MathAnalystAgent {
  constructor(bedrock) {
    this.bedrock = bedrock;
    this.role = "Mathematical Analyst";
  }

  async analyze(message) {
    // Extract numbers using regex
    const numbers = message.match(/-?\d+(?:\.\d+)?/g);
    const numberValues = numbers ? numbers.map(n => parseFloat(n)) : [];

    const prompt = `You are a Mathematical Analyst. Analyze this request for mathematical operations:

Message: "${message}"
Detected numbers: ${numberValues.join(', ')}

Based on the number of parameters, determine:
- If 2 numbers: use MCP v1.0 
- If 3 numbers: use MCP v1.1
- Otherwise: explain limitation

Respond with JSON:
{
  "numbers": [array of numbers],
  "mcpVersion": "1.0" or "1.1" or "unsupported",
  "approach": "brief explanation"
}`;

    const response = await this.bedrock.invokeModel(prompt, { maxTokens: 200 });
    
    if (response.success) {
      try {
        return JSON.parse(response.content);
      } catch {
        return this.fallbackAnalysis(numberValues);
      }
    } else {
      return this.fallbackAnalysis(numberValues);
    }
  }

  fallbackAnalysis(numbers) {
    if (numbers.length === 2) {
      return {
        numbers: numbers,
        mcpVersion: "1.0",
        approach: "2 numbers detected, using MCP v1.0"
      };
    } else if (numbers.length === 3) {
      return {
        numbers: numbers,
        mcpVersion: "1.1", 
        approach: "3 numbers detected, using MCP v1.1"
      };
    } else {
      return {
        numbers: numbers,
        mcpVersion: "unsupported",
        approach: `${numbers.length} numbers detected, only 2 or 3 supported`
      };
    }
  }
}

class MCPExecutorAgent {
  constructor(mcpV1, mcpV11) {
    this.mcpV1 = mcpV1;
    this.mcpV11 = mcpV11;
    this.role = "MCP Executor";
  }

  async execute(analysis) {
    const { numbers, mcpVersion } = analysis;
    
    try {
      if (mcpVersion === "1.0" && numbers.length >= 2) {
        if (!this.mcpV1.connected) {
          return {
            success: false,
            status: "MCP v1.0 not available",
            error: "Connection failed"
          };
        }
        
        const result = await this.mcpV1.sum({ 
          a: numbers[0], 
          b: numbers[1] 
        });
        
        return {
          success: true,
          status: "MCP v1.0 execution successful",
          result: result,
          version: "1.0"
        };
        
      } else if (mcpVersion === "1.1" && numbers.length >= 3) {
        if (!this.mcpV11.connected) {
          return {
            success: false,
            status: "MCP v1.1 not available", 
            error: "Connection failed"
          };
        }
        
        const result = await this.mcpV11.sum({ 
          a: numbers[0], 
          b: numbers[1], 
          c: numbers[2] 
        });
        
        return {
          success: true,
          status: "MCP v1.1 execution successful",
          result: result,
          version: "1.1"
        };
        
      } else {
        return {
          success: false,
          status: "Unsupported operation",
          error: `Cannot process ${numbers.length} numbers with available MCP versions`
        };
      }
    } catch (error) {
      return {
        success: false,
        status: "MCP execution failed",
        error: error.message
      };
    }
  }
}

class PresenterAgent {
  constructor(bedrock) {
    this.bedrock = bedrock;
    this.role = "Result Presenter";
  }

  async present(execution, originalMessage) {
    if (!execution.success) {
      return {
        response: `❌ ${execution.status}: ${execution.error}`
      };
    }

    try {
      // Parse MCP result
      const mcpData = JSON.parse(execution.result.content[0].text);
      
      const prompt = `You are a Result Presenter. Format this mathematical result in a clear, user-friendly way:

Original request: "${originalMessage}"
MCP Version used: ${execution.version}
Calculation result: ${mcpData.result}
Operation: ${mcpData.operation}

Create a clear, concise response that shows:
1. The result
2. Which system was used
3. The operation performed

Keep it friendly and informative.`;

      const response = await this.bedrock.invokeModel(prompt, { maxTokens: 200 });
      
      if (response.success) {
        return {
          response: `✅ ${response.content}`
        };
      } else {
        return {
          response: `✅ Result: ${mcpData.result} (${mcpData.operation}) via MCP v${execution.version}`
        };
      }
    } catch (error) {
      return {
        response: `✅ Calculation completed via MCP v${execution.version}`
      };
    }
  }
}