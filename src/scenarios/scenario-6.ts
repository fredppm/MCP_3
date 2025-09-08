/**
 * Scenario 6: Agent Restart During Version Change
 * Tests fresh agent adaptation to new MCP capabilities
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, startV1Services, startV11Services, Services } from './utils.ts';

export async function scenario6(): Promise<void> {
  console.log('\n📋 SCENARIO 6: Agent Restart During Version Change');
  console.log('🎯 Objective: Test fresh agent adaptation to new MCP capabilities');
  console.log('📝 Expected: Fresh agent adapts correctly to v1.1');
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
  const agentResultV1 = await executeAgent('1+1+1');
  console.log('\nPhase 1 Result:', agentResultV1 ? '✅ Success (2 calls expected)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when ready to restart with v1.1...',
    default: true
  });
  
  // Step 3: Swap to v1.1
  console.log('\n🔄 Step 3: Swapping to v1.1...');
  await killProcesses();
  
  services = await startV11Services();
  await setTimeout(3000);
  
  console.log('\n✅ v1.1 services started!');
  console.log('\n🤖 Phase 2: Testing with fresh agent on v1.1 (should use 1 call)');
  console.log('📝 Expected: Fresh agent adapts correctly');
  console.log('📊 Expected behavior:');
  console.log('   - v1.0 behavior: 2 calls for 1+1+1');
  console.log('   - v1.1 behavior: 1 call for 1+1+1');
  console.log('   - Fresh agent properly detects new capabilities');
  console.log();
  console.log('🔍 Key Learning:');
  console.log('   - Agent restart enables proper adaptation');
  console.log('   - Fresh discovery process detects new MCP contracts');
  console.log('   - Coordinated deployments require agent restarts');
  console.log();
  
  // Execute fresh agent with v1.1
  const agentResultV11 = await executeAgent('1+1+1');
  console.log('\nPhase 2 Result:', agentResultV11 ? '✅ Success (1 call expected - proper adaptation)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when test is complete...',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  await killProcesses();
  
  console.log('✅ Scenario 6 completed!');
}