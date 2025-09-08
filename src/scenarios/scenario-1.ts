/**
 * Scenario 1: v1.0 Basic Operation (1+1)
 * Tests basic functionality with v1.0 - single MCP call
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, startV1Services, Services } from './utils.ts';

export async function scenario1(): Promise<void> {
  console.log('\n📋 SCENARIO 1: v1.0 Basic Operation (1+1)');
  console.log('🎯 Objective: Test basic functionality with v1.0');
  console.log('📝 Expected: Single MCP call, result = 2');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.0 services
  console.log('🚀 Step 2: Starting v1.0 services...');
  const services = await startV1Services();
  
  await setTimeout(5000);
  
  console.log('\n🤖 Executing agent with command: 1+1');
  console.log('📊 Expected behavior:');
  console.log('   - Agent should make exactly 1 MCP call');
  console.log('   - Parameters: a=1, b=1');
  console.log('   - Result: 2');
  console.log('   - No chaining required');
  console.log();
  
  // Execute agent with direct command
  const agentResult = await executeAgent('1+1');
  
  console.log('\n📋 Agent execution completed!');
  console.log('Result:', agentResult ? '✅ Success' : '❌ Failed');
  
  // Wait for user to review results
  await confirm({
    message: 'Press Enter to continue after reviewing the agent output above',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  await killProcesses();
  
  console.log('✅ Scenario 1 completed!');
}