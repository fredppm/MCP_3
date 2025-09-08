/**
 * Scenario 3: v1.1 Breaking Change (1+1)
 * Tests v1.1 contract mismatch - initial failure scenario
 */

import { setTimeout } from 'timers/promises';
import { confirm } from '@inquirer/prompts';
import { killProcesses, executeAgent, startV11ServicesNoDefault } from './utils.ts';

export async function scenario3(): Promise<void> {
  console.log('\n📋 SCENARIO 3: v1.1 Breaking Change (1+1)');
  console.log('🎯 Objective: Test v1.1 contract mismatch');
  console.log('📝 Expected: Initial failure, then success after making c optional');
  console.log();

  // Step 1: Cleanup existing processes
  console.log('🧹 Step 1: Cleaning up existing processes...');
  await killProcesses();
  
  // Step 2: Start v1.1 services with --no-default-c flag
  console.log('🚀 Step 2: Starting v1.1 services with --no-default-c flag...');
  const services = await startV11ServicesNoDefault();
  
  await setTimeout(5000);
  
  console.log('\n🤖 Executing agent with command: 1+1');
  console.log('📊 Expected behavior:');
  console.log('   - Initial: ❌ Contract mismatch prevents execution');
  console.log('   - After fix: ✅ Agent can call with 2 parameters');
  console.log('   - Parameter c gets default value 0');
  console.log('   - Final result: 1+1+0 = 2');
  console.log();
  console.log('🔍 Key Learning:');
  console.log('   - Breaking changes in MCP contracts cause immediate failures');
  console.log('   - Optional parameters with defaults enable backward compatibility');
  console.log();
  
  // Execute agent with direct command (should initially fail)
  const agentResult = await executeAgent('1+1');
  
  console.log('\n📋 Agent execution completed!');
  console.log('Result:', agentResult ? '✅ Success' : '❌ Expected Failure (Breaking Change)');
  console.log();
  console.log('💡 Next steps to fix:');
  console.log('   1. Modify v1.1/mcp/server.ts to make c optional with default 0');
  console.log('   2. Restart MCP server');
  console.log('   3. Retry command: 1+1');
  
  // Wait for user to review results
  await confirm({
    message: 'Press Enter to continue after reviewing the agent output above',
    default: true
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up services...');
  await killProcesses();
  
  console.log('✅ Scenario 3 completed!');
}