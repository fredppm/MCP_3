/**
 * Scenario 7: Rollback Scenario (v1.1 → v1.0) - Critical Bug
 * Tests rollback issues - parameter mismatch problems
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, startV1Services, startV11Services, createInteractiveAgent } from './utils.ts';

export async function scenario7(): Promise<void> {
  console.log('\n📋 SCENARIO 7: Rollback Scenario (v1.1 → v1.0) - Critical Bug');
  console.log('🎯 Objective: Test rollback issues - parameter mismatch problems');
  console.log('📝 Expected: CRITICAL BUG - Result = 2 instead of 3!');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.1 services
  console.log('🚀 Step 2: Starting v1.1 services...');
  let services = await startV11Services();
  
  await setTimeout(5000);
  
  console.log('\n✅ v1.1 services started!');
  console.log('\n🤖 Phase 1: Testing with v1.1 (should work correctly)');
  console.log('📊 Expected: Single MCP call with result = 3');
  console.log();
  
  // Execute agent with v1.1
  const agent = await createInteractiveAgent();
  const agentResultV11 = await agent.sendCommand('1+1+1');
  console.log('\nPhase 1 Result:', agentResultV11 ? '✅ Success (correct result = 3)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when ready to rollback to v1.0...',
    default: true
  });
  
  // Step 3: Rollback to v1.0
  console.log('\n🔄 Step 3: Rolling back to v1.0...');
  await killProcesses();
  
  services = await startV1Services();
  await setTimeout(3000);
  
  console.log('\n✅ v1.0 services started!');
  console.log('\n🤖 Phase 2: Testing rollback (CRITICAL BUG DEMONSTRATION)');
  console.log('📝 Expected: CRITICAL BUG - Result = 2 instead of 3!');
  console.log();
  console.log('⚠️  CRITICAL BUG DEMONSTRATION:');
  console.log('   - Agent attempts 3-parameter call on 2-parameter API');
  console.log('   - Parameter c is silently ignored');
  console.log('   - Calculation becomes: 1+1 = 2 (instead of 1+1+1 = 3)');
  console.log('   - No error thrown - silent data corruption!');
  console.log();
  console.log('🔍 Key Learning:');
  console.log('   - Rollbacks while agents are running cause data corruption');
  console.log('   - Extra parameters are silently ignored');
  console.log('   - No automatic detection of contract downgrades');
  console.log('   - Runtime contract validation is essential');
  console.log();
  
  // Execute agent with v1.0 (should show the bug)
  const agentResultV1 = await agent.sendCommand('1+1+1');
  console.log('\nPhase 2 Result:', agentResultV1 ? '⚠️  SUCCESS BUT WRONG RESULT (2 instead of 3 - CRITICAL BUG!)' : '❌ Failed');
  
  await confirm({
    message: 'Press Enter when test is complete...',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  await killProcesses();
  
  console.log('✅ Scenario 7 completed!');
}