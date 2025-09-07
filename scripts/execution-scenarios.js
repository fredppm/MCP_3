#!/usr/bin/env node

/**
 * Automated execution scenarios for MCP Server Evolution Testing
 * This script automates all 7 execution scenarios described in the README
 */

import { spawn, exec } from 'child_process';
import os from 'os';
import { setTimeout } from 'timers/promises';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function killProcesses() {
  return new Promise((resolve) => {
    const killCmd = os.platform() === 'win32' 
      ? 'powershell "Get-NetTCPConnection -LocalPort 4000,4001,4002,4003 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 2"'
      : 'lsof -ti :4000,:4001,:4002,:4003 | xargs -r kill -9; sleep 2';
    
    exec(killCmd, () => {
      console.log('🧹 Cleaned up existing processes');
      resolve();
    });
  });
}

function startServices(version) {
  return new Promise((resolve) => {
    console.log(`🚀 Starting ${version} services...`);
    const services = spawn('npm', ['run', `start-${version}`], {
      stdio: 'pipe',
      shell: true
    });
    
    services.stdout.on('data', (data) => {
      console.log(`[${version}] ${data.toString().trim()}`);
    });
    
    services.stderr.on('data', (data) => {
      console.log(`[${version} ERROR] ${data.toString().trim()}`);
    });
    
    // Wait for services to start
    setTimeout(() => {
      resolve(services);
    }, 5000);
  });
}

function startAgent() {
  return new Promise((resolve) => {
    console.log('🤖 Starting agent...');
    const agent = spawn('npm', ['run', 'praison-agent'], {
      stdio: 'pipe',
      shell: true,
      cwd: './agent'
    });
    
    agent.stdout.on('data', (data) => {
      console.log(`[AGENT] ${data.toString().trim()}`);
    });
    
    agent.stderr.on('data', (data) => {
      console.log(`[AGENT ERROR] ${data.toString().trim()}`);
    });
    
    // Wait for agent to start
    setTimeout(() => {
      resolve(agent);
    }, 3000);
  });
}

function stopProcess(process) {
  if (process && !process.killed) {
    process.kill('SIGTERM');
    console.log('⏹️  Process stopped');
  }
}

async function execution1() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 1: v1.0 Basic Operation (1+1)');
  console.log('='.repeat(60));
  
  await killProcesses();
  const services = await startServices('v1');
  
  console.log('\n✅ Setup complete!');
  console.log('📝 Expected: Single MCP call, result = 2');
  console.log('\n🔧 Manual step required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1');
  console.log('   3. Observe: Single tool call');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution2() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 2: v1.0 with 3-Number Request (1+1+1)');
  console.log('='.repeat(60));
  
  await killProcesses();
  const services = await startServices('v1');
  
  console.log('\n✅ Setup complete!');
  console.log('📝 Expected: Two chained MCP calls, result = 3');
  console.log('\n🔧 Manual step required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1+1');
  console.log('   3. Observe: Two sequential tool calls: (1+1) + 1');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution3() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 3: v1.1 with 2-Number Request (1+1)');
  console.log('='.repeat(60));
  
  await killProcesses();
  const services = await startServices('v1.1');
  
  console.log('\n✅ Setup complete!');
  console.log('📝 Expected: Initial failure, then success after making c optional');
  console.log('\n🔧 Manual steps required:');
  console.log('   1. Start NEW agent: npm run praison-agent');
  console.log('   2. Send command: 1+1');
  console.log('   3. Observe: Tool call rejection (requires a, b, c)');
  console.log('   4. Modify v1.1/mcp/server.js to make c optional with default 0');
  console.log('   5. Restart MCP server');
  console.log('   6. Retry command: 1+1');
  console.log('   7. Observe: Success');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution4() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 4: v1.1 with 3-Number Request (1+1+1)');
  console.log('='.repeat(60));
  
  await killProcesses();
  const services = await startServices('v1.1');
  
  console.log('\n✅ Setup complete!');
  console.log('📝 Expected: Single MCP call, result = 3');
  console.log('\n🔧 Manual step required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1+1');
  console.log('   3. Observe: Single tool call with all 3 parameters');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution5() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 5: Hot-Swap During Runtime (v1.0 → v1.1)');
  console.log('='.repeat(60));
  
  await killProcesses();
  let services = await startServices('v1');
  
  console.log('\n✅ v1.0 services started!');
  console.log('\n🔧 Manual steps required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1+1 (should use 2 calls)');
  console.log('   3. Keep agent running!');
  
  await question('\nPress Enter when ready to swap to v1.1...');
  
  console.log('🔄 Swapping to v1.1...');
  stopProcess(services);
  await setTimeout(2000);
  services = await startServices('v1.1');
  
  console.log('\n✅ v1.1 services started!');
  console.log('📝 Expected: Agent still uses 2 calls (doesn\'t detect change)');
  console.log('\n🔧 Continue with agent:');
  console.log('   4. Send same command: 1+1+1');
  console.log('   5. Observe: Still uses 2 calls instead of optimizing to 1');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution6() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 6: Agent Restart During Version Change');
  console.log('='.repeat(60));
  
  await killProcesses();
  let services = await startServices('v1');
  
  console.log('\n✅ v1.0 services started!');
  console.log('\n🔧 Manual steps required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1+1 (should use 2 calls)');
  console.log('   3. Stop agent');
  
  await question('\nPress Enter when ready to restart with v1.1...');
  
  console.log('🔄 Swapping to v1.1...');
  stopProcess(services);
  await setTimeout(2000);
  services = await startServices('v1.1');
  
  console.log('\n✅ v1.1 services started!');
  console.log('📝 Expected: Fresh agent adapts correctly');
  console.log('\n🔧 Continue:');
  console.log('   4. Start NEW agent: npm run praison-agent');
  console.log('   5. Send command: 1+1+1');
  console.log('   6. Observe: Uses 1 call (proper adaptation)');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function execution7() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION 7: Rollback Scenario (v1.1 → v1.0)');
  console.log('='.repeat(60));
  
  await killProcesses();
  let services = await startServices('v1.1');
  
  console.log('\n✅ v1.1 services started!');
  console.log('\n🔧 Manual steps required:');
  console.log('   1. Start agent: npm run praison-agent');
  console.log('   2. Send command: 1+1+1=3 (should work correctly)');
  console.log('   3. Keep agent running!');
  
  await question('\nPress Enter when ready to rollback to v1.0...');
  
  console.log('🔄 Rolling back to v1.0...');
  stopProcess(services);
  await setTimeout(2000);
  services = await startServices('v1');
  
  console.log('\n✅ v1.0 services started!');
  console.log('📝 Expected: CRITICAL BUG - Result = 2 instead of 3!');
  console.log('\n🔧 Continue with same agent:');
  console.log('   4. Send same command: 1+1+1');
  console.log('   5. Observe: Result = 2 (parameter c ignored!)');
  
  await question('\nPress Enter when test is complete...');
  stopProcess(services);
}

async function runAllExecutions() {
  console.log('🎯 MCP Server Evolution Testing - Automated Execution Scenarios');
  console.log('================================================================');
  
  const scenarios = [
    { name: 'Execution 1: v1.0 Basic (1+1)', fn: execution1 },
    { name: 'Execution 2: v1.0 Chain (1+1+1)', fn: execution2 },
    { name: 'Execution 3: v1.1 Contract Issue (1+1)', fn: execution3 },
    { name: 'Execution 4: v1.1 Optimal (1+1+1)', fn: execution4 },
    { name: 'Execution 5: Hot-swap Runtime', fn: execution5 },
    { name: 'Execution 6: Agent Restart', fn: execution6 },
    { name: 'Execution 7: Rollback Bug', fn: execution7 }
  ];
  
  console.log('\nAvailable scenarios:');
  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
  });
  console.log('8. Run all scenarios');
  console.log('0. Exit');
  
  const choice = await question('\nSelect scenario (1-8, 0 to exit): ');
  const num = parseInt(choice);
  
  if (num === 0) {
    console.log('👋 Goodbye!');
    rl.close();
    return;
  }
  
  if (num === 8) {
    for (const scenario of scenarios) {
      await scenario.fn();
      const continueChoice = await question('\nContinue to next scenario? (y/n): ');
      if (continueChoice.toLowerCase() !== 'y') break;
    }
  } else if (num >= 1 && num <= 7) {
    await scenarios[num - 1].fn();
  } else {
    console.log('❌ Invalid choice');
  }
  
  await killProcesses();
  rl.close();
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🧹 Cleaning up...');
  await killProcesses();
  rl.close();
  process.exit(0);
});

runAllExecutions().catch(console.error);