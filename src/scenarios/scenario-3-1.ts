/**
 * Scenario 3.1: v1.1 --no-default-c (Avoiding Breaking Changes)
 * Tests proper MCP evolution without breaking changes
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, stopProcess, startV11ServicesNoDefault, Services } from './utils.ts';

export async function scenario3_1(): Promise<void> {
  console.log('\n📋 SCENARIO 3.1: v1.1 --no-default-c (Avoiding Breaking Changes)');
  console.log('🎯 Objective: Test proper MCP evolution without breaking changes');
  console.log('📝 Expected: Tool requires all 3 parameters - NO breaking change!');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.1 services with --no-default-c flag
  console.log('🚀 Step 2: Starting v1.1 services with --no-default-c flag...');
  const services = await startV11ServicesNoDefault();
  
  // Step 3: Wait for services to be ready
  console.log('⏳ Step 3: Waiting for services to initialize...');
  await setTimeout(5000);
  
  console.log('\n✅ Setup complete!');
  console.log('\n🤖 Executing agent with command: 1+1');
  console.log('📊 Expected behavior:');
  console.log('   - ❌ Agent cannot call with only 2 parameters');
  console.log('   - ✅ Contract integrity maintained');
  console.log('   - ✅ No silent failures or incorrect results');
  console.log('   - ✅ Explicit parameter requirements enforced');
  console.log();
  console.log('🔍 Key Learning:');
  console.log('   - Using --no-default-c prevents breaking changes');
  console.log('   - Explicit parameter requirements maintain contract integrity');
  console.log('   - Prevents silent failures during API evolution');
  console.log('   - Forces proper client adaptation to new contracts');
  console.log();
  
  // Execute agent with direct command (should fail)
  const agentResult = await executeAgent('1+1');
  
  console.log('\n📋 Agent execution completed!');
  console.log('Result:', agentResult ? '⚠️  Unexpected Success' : '✅ Expected Failure (Contract Integrity Maintained)');
  
  // Wait for user to review results
  await confirm({
    message: 'Press Enter to continue after reviewing the agent output above',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  stopProcess(services.rest);
  stopProcess(services.mcp);
  await killProcesses();
  
  console.log('✅ Scenario 3.1 completed!');
}