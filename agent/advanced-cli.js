import { MultiAgentSystem } from './multi-agent.js';
import { MathWorkflowEngine } from './workflow-engine.js';
import readline from 'readline';

class AdvancedMultiAgentCLI {
  constructor() {
    this.system = new MultiAgentSystem({
      region: process.env.AWS_REGION || 'us-east-1',
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    });
    
    this.workflowEngine = null;
    this.mode = 'direct'; // 'direct' or 'workflow'
    this.verbose = false;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.setupWorkflowListeners();
  }

  setupWorkflowListeners() {
    // We'll set up listeners after workflow engine is created
  }

  async start() {
    console.log('🎭 Advanced Multi-Agent System');
    console.log('   AWS Bedrock + MCP + Workflow Engine');
    console.log('=' .repeat(50));
    
    try {
      const status = await this.system.initialize();
      this.workflowEngine = new MathWorkflowEngine(this.system);
      this.setupWorkflowEngineListeners();
      
      console.log('\n📊 System Status:');
      console.log(`   MCP v1.0: ${status.v1Connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   MCP v1.1: ${status.v11Connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   AWS Bedrock: Configured`);
      console.log(`   Workflow Engine: ✅ Ready`);
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      console.log('⚠️  Some features may not work properly');
    }

    this.showHelp();
    this.startChat();
  }

  setupWorkflowEngineListeners() {
    if (this.verbose) {
      this.workflowEngine.on('workflowStarted', (execution) => {
        console.log(`🚀 Workflow started: ${execution.workflowName} (${execution.id})`);
      });

      this.workflowEngine.on('stepStarted', ({ execution, step, stepIndex }) => {
        console.log(`   ⏳ Step ${stepIndex + 1}: ${step.name}`);
      });

      this.workflowEngine.on('stepCompleted', ({ execution, step, result, stepIndex }) => {
        console.log(`   ✅ Step ${stepIndex + 1} completed: ${step.name}`);
      });

      this.workflowEngine.on('workflowCompleted', (execution) => {
        console.log(`🎉 Workflow completed: ${execution.workflowName} (${execution.totalDuration}ms)`);
      });

      this.workflowEngine.on('workflowFailed', ({ execution, error }) => {
        console.log(`❌ Workflow failed: ${execution.workflowName} - ${error.message}`);
      });
    }
  }

  showHelp() {
    console.log('\n🤖 Advanced Features:');
    console.log('   🎯 Direct Mode: Direct agent communication');
    console.log('   🔄 Workflow Mode: Structured workflow execution');
    console.log('   📊 Verbose logging for workflow steps');
    console.log('\n💬 Commands:');
    console.log('   /mode [direct|workflow] - Switch processing mode');
    console.log('   /verbose [on|off] - Toggle verbose logging');
    console.log('   /workflows - List available workflows');
    console.log('   /status - Show system status');
    console.log('   /help - Show this help');
    console.log('   /quit - Exit');
    console.log('\n💡 Examples:');
    console.log('   • "sum 15 and 25"');
    console.log('   • "calculate 10 + 20 + 30"');
    console.log('   • "hello there!"');
    console.log(`\n🔧 Current Mode: ${this.mode.toUpperCase()}`);
    console.log(`🔊 Verbose: ${this.verbose ? 'ON' : 'OFF'}`);
    console.log('\n' + '='.repeat(50));
  }

  startChat() {
    this.askQuestion();
  }

  askQuestion() {
    const modeIndicator = this.mode === 'workflow' ? '🔄' : '🎯';
    this.rl.question(`\n${modeIndicator} You: `, async (input) => {
      const trimmedInput = input.trim();
      
      // Handle commands
      if (trimmedInput.startsWith('/')) {
        await this.handleCommand(trimmedInput);
        this.askQuestion();
        return;
      }

      if (trimmedInput.toLowerCase() === 'quit') {
        await this.shutdown();
        return;
      }

      console.log(`\n${modeIndicator} Processing in ${this.mode.toUpperCase()} mode...`);
      const startTime = Date.now();
      
      try {
        let response;
        
        if (this.mode === 'workflow') {
          // Use workflow engine
          const execution = await this.workflowEngine.processMathRequest(trimmedInput);
          response = execution.stepResults[execution.stepResults.length - 1].result.finalResponse;
          
          if (!this.verbose) {
            console.log(`🔄 Workflow: ${execution.workflowName} (${execution.stepResults.length} steps)`);
          }
        } else {
          // Direct mode
          response = await this.system.processRequest(trimmedInput);
        }
        
        const duration = Date.now() - startTime;
        
        console.log(`\n🤖 System: ${response}`);
        console.log(`⏱️  Processed in ${duration}ms`);
        
      } catch (error) {
        console.error(`\n❌ System Error: ${error.message}`);
      }
      
      this.askQuestion();
    });
  }

  async handleCommand(command) {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    switch (cmd.toLowerCase()) {
      case 'mode':
        await this.handleModeCommand(args[0]);
        break;
        
      case 'verbose':
        await this.handleVerboseCommand(args[0]);
        break;
        
      case 'workflows':
        await this.handleWorkflowsCommand();
        break;
        
      case 'status':
        await this.showStatus();
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      case 'quit':
        await this.shutdown();
        break;
        
      default:
        console.log(`❓ Unknown command: /${cmd}`);
        console.log('   Type /help for available commands');
    }
  }

  async handleModeCommand(mode) {
    if (!mode) {
      console.log(`🔧 Current mode: ${this.mode.toUpperCase()}`);
      console.log('   Available modes: direct, workflow');
      return;
    }

    if (['direct', 'workflow'].includes(mode.toLowerCase())) {
      this.mode = mode.toLowerCase();
      console.log(`🔧 Mode switched to: ${this.mode.toUpperCase()}`);
    } else {
      console.log('❌ Invalid mode. Use: direct or workflow');
    }
  }

  async handleVerboseCommand(setting) {
    if (!setting) {
      console.log(`🔊 Verbose logging: ${this.verbose ? 'ON' : 'OFF'}`);
      return;
    }

    if (['on', 'true', '1'].includes(setting.toLowerCase())) {
      this.verbose = true;
      console.log('🔊 Verbose logging: ON');
    } else if (['off', 'false', '0'].includes(setting.toLowerCase())) {
      this.verbose = false;
      console.log('🔊 Verbose logging: OFF');
    } else {
      console.log('❌ Invalid setting. Use: on or off');
    }
  }

  async handleWorkflowsCommand() {
    const workflows = this.workflowEngine.listWorkflows();
    
    console.log('\n🔄 Available Workflows:');
    workflows.forEach((workflow, index) => {
      console.log(`   ${index + 1}. ${workflow.name} (${workflow.steps.length} steps)`);
      workflow.steps.forEach((step, stepIndex) => {
        console.log(`      ${stepIndex + 1}. ${step.name}`);
      });
    });
  }

  async showStatus() {
    console.log('\n📊 Advanced System Status:');
    
    // System info
    console.log(`   Mode: ${this.mode.toUpperCase()}`);
    console.log(`   Verbose: ${this.verbose ? 'ON' : 'OFF'}`);
    
    // MCP connections
    try {
      const v1Status = this.system.mcpV1.connected;
      const v11Status = this.system.mcpV11.connected;
      
      console.log(`   MCP v1.0: ${v1Status ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   MCP v1.1: ${v11Status ? '✅ Connected' : '❌ Disconnected'}`);
      
      // Test Bedrock connection
      console.log('   AWS Bedrock: Testing...');
      const testResponse = await this.system.bedrock.invokeModel('Test', { maxTokens: 5 });
      console.log(`   AWS Bedrock: ${testResponse.success ? '✅ Connected' : '❌ Error: ' + testResponse.error}`);
      
      // Workflow engine status
      const activeExecutions = this.workflowEngine.listActiveExecutions();
      console.log(`   Active Workflows: ${activeExecutions.length}`);
      
    } catch (error) {
      console.log(`   Status check failed: ${error.message}`);
    }
  }

  async shutdown() {
    console.log('\n🔄 Shutting down Advanced Multi-Agent System...');
    
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
  console.log('🎯 Starting Advanced Multi-Agent CLI...');
  const cli = new AdvancedMultiAgentCLI();
  cli.start().catch(console.error);
}

export { AdvancedMultiAgentCLI };