/**
 * Scenario 2: v1.0 Chain Operation (1+1+1)
 * Tests v1.0 with 3-number request - chained MCP calls
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, startV1Services, Services } from './utils.ts';

export async function scenario2(): Promise<void> {
  console.log('\n📋 SCENARIO 2: v1.0 Chain Operation (1+1+1)');
  console.log('🎯 Objective: Test v1.0 with 3-number request');
  console.log('📝 Expected: Two chained MCP calls, result = 3');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.0 services
  console.log('🚀 Step 2: Starting v1.0 services...');
  const services = await startV1Services();
  
  await setTimeout(5000);
  
  console.log('\n🤖 Executing agent with command: 1+1+1');
  console.log('📊 Expected behavior:');
  console.log('   - Agent should make 2 MCP calls');
  console.log('   - First call: a=1, b=1 → result=2');
  console.log('   - Second call: a=2, b=1 → result=3');
  console.log('   - Final result: 3');
  console.log('   - Demonstrates intelligent chaining: (1+1) + 1 = 3');
  console.log();
  
  // Execute agent with direct command
  const agentResult = await executeAgent('1+1+1');
  
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
  
  console.log('✅ Scenario 2 completed!');
}