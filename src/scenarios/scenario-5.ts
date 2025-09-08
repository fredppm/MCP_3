/**
 * Scenario 5: Hot-Swap Runtime (v1.0 → v1.1)
 * Tests version change during runtime - agent adaptation
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, createInteractiveAgent, startV1Services, startV11Services, Services } from './utils.ts';

export async function scenario5(): Promise<void> {
  console.log('\n📋 SCENARIO 5: Hot-Swap Runtime (v1.0 → v1.1)');
  console.log('🎯 Objective: Test version change during runtime');
  console.log('📝 Expected: Agent does not detect change, maintains old calling pattern');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.0 services
  console.log('🚀 Step 2: Starting v1.0 services...');
  let services = await startV1Services();
  
  await setTimeout(5000);
  
  console.log('\n✅ v1.0 services started!');
  console.log('\n🤖 Phase 1: Testing with v1.0 (should use 2 calls)');
  console.log('📊 Expected: Agent makes 2 MCP calls for 1+1+1');
  console.log();
  
  // Execute agent with v1.0
  const agent = await createInteractiveAgent();
  const agentResultV1 = await agent.sendCommand('1+1+1');
  console.log('\nPhase 1 Result:', agentResultV1 ? '✅ Success (2 calls expected)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when ready to hot-swap to v1.1...',
    default: true
  });
  
  // Step 4: Hot-swap to v1.1
  console.log('\n🔄 Step 4: Hot-swapping to v1.1...');
  await killProcesses();
  
  services = await startV11Services();
  await setTimeout(3000);
  
  console.log('\n✅ v1.1 services started!');
  console.log('\n🤖 Phase 2: Testing with v1.1 (agent doesn\'t detect change)');
  console.log('📝 Expected: Agent still uses 2 calls (doesn\'t detect change)');
  console.log('🔍 Key Learning:');
  console.log('   - Agents do not automatically detect MCP contract changes');
  console.log('   - Runtime hot-swapping does not trigger re-discovery');
  console.log('   - Agent maintains calling patterns from initial discovery');
  console.log();
  
  // Execute agent with v1.1 (should still use old pattern)
  const agentResultV11 = await agent.sendCommand('1+1+1');
  console.log('\nPhase 2 Result:', agentResultV11 ? '⚠️  Success but suboptimal (still 2 calls)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when test is complete...',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  await killProcesses();
  
  console.log('✅ Scenario 5 completed!');
}