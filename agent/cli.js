import { MultiAgentSystem } from './multi-agent.js';
import readline from 'readline';

class MultiAgentCLI {
  constructor() {
    this.system = new MultiAgentSystem({
      region: process.env.AWS_REGION || 'us-east-1',
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    });
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🎭 Multi-Agent System with AWS Bedrock + MCP');
    console.log('==================================================');
    
    try {
      const status = await this.system.initialize();
      
      console.log('\n📊 System Status:');
      console.log(`   MCP v1.0: ${status.v1Connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   MCP v1.1: ${status.v11Connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   AWS Bedrock: Configured`);
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      console.log('⚠️  Some features may not work properly');
    }

    this.showHelp();
    this.startChat();
  }

  showHelp() {
    console.log('\n🤖 Multi-Agent Capabilities:');
    console.log('   📊 Coordinator: Routes requests to appropriate agents');
    console.log('   🔢 Math Analyst: Analyzes mathematical operations');
    console.log('   ⚡ MCP Executor: Executes calculations via MCP servers');
    console.log('   📋 Presenter: Formats results using AI');
    console.log('\n💡 Examples:');
    console.log('   • "sum 15 and 25" (uses MCP v1.0)');
    console.log('   • "calculate 10 + 20 + 30" (uses MCP v1.1)');
    console.log('   • "hello there!" (general chat via Bedrock)');
    console.log('   • "quit" to exit');
    console.log('\n' + '='.repeat(50));
  }

  startChat() {
    this.askQuestion();
  }

  askQuestion() {
    this.rl.question('\n🧑 You: ', async (input) => {
      if (input.toLowerCase().trim() === 'quit') {
        await this.shutdown();
        return;
      }

      if (input.toLowerCase().trim() === 'help') {
        this.showHelp();
        this.askQuestion();
        return;
      }

      if (input.toLowerCase().trim() === 'status') {
        await this.showStatus();
        this.askQuestion();
        return;
      }

      console.log('\n🎯 Processing through multi-agent system...');
      const startTime = Date.now();
      
      try {
        const response = await this.system.processRequest(input);
        const duration = Date.now() - startTime;
        
        console.log(`\n🤖 System: ${response}`);
        console.log(`⏱️  Processed in ${duration}ms`);
        
      } catch (error) {
        console.error(`\n❌ System Error: ${error.message}`);
      }
      
      this.askQuestion();
    });
  }

  async showStatus() {
    console.log('\n📊 System Status Check:');
    
    // Check MCP connections
    try {
      const v1Status = this.system.mcpV1.connected;
      const v11Status = this.system.mcpV11.connected;
      
      console.log(`   MCP v1.0: ${v1Status ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   MCP v1.1: ${v11Status ? '✅ Connected' : '❌ Disconnected'}`);
      
      // Test Bedrock connection
      console.log('   AWS Bedrock: Testing...');
      const testResponse = await this.system.bedrock.invokeModel('Say "OK" if you can hear me', { maxTokens: 10 });
      console.log(`   AWS Bedrock: ${testResponse.success ? '✅ Connected' : '❌ Error: ' + testResponse.error}`);
      
    } catch (error) {
      console.log(`   Status check failed: ${error.message}`);
    }
  }

  async shutdown() {
    console.log('\n🔄 Shutting down Multi-Agent System...');
    
    try {
      await this.system.shutdown();
      console.log('👋 Goodbye!');
    } catch (error) {
      console.error('Error during shutdown:', error.message);
    }
    
    this.rl.close();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received interrupt signal...');
  process.exit(0);
});

// Start the CLI if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new MultiAgentCLI();
  cli.start().catch(console.error);
}

export { MultiAgentCLI };