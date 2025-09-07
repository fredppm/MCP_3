#!/usr/bin/env node

/**
 * Quick test runner for specific MCP evolution scenarios
 * Usage: npm run quick-test [scenario-number]
 */

import { spawn, exec } from 'child_process';
import os from 'os';

const scenarios = {
  1: {
    name: 'v1.0 Basic Operation (1+1)',
    version: 'v1',
    command: '1+1',
    expected: 'Single MCP call, result = 2',
    type: 'basic'
  },
  2: {
    name: 'v1.0 with 3-Number Request (1+1+1)',
    version: 'v1',
    command: '1+1+1',
    expected: 'Two chained MCP calls, result = 3',
    type: 'basic'
  },
  3: {
    name: 'v1.1 with 2-Number Request (1+1)',
    version: 'v1.1',
    command: '1+1',
    expected: 'Initial failure, then success after making c optional',
    type: 'basic'
  },
  4: {
    name: 'v1.1 with 3-Number Request (1+1+1)',
    version: 'v1.1',
    command: '1+1+1',
    expected: 'Single MCP call, result = 3',
    type: 'basic'
  },
  5: {
    name: 'Hot-Swap During Runtime (v1.0 → v1.1)',
    version: 'v1',
    command: '1+1+1',
    expected: 'Agent maintains old calling pattern after hot-swap',
    type: 'complex',
    instructions: [
      'Start with v1.0, test 1+1+1 (2 calls)',
      'Keep agent running',
      'Stop v1.0 services manually',
      'Start v1.1 services manually',
      'Test same 1+1+1 command',
      'Observe: Still uses 2 calls (no detection of change)'
    ]
  },
  6: {
    name: 'Agent Restart During Version Change',
    version: 'v1',
    command: '1+1+1',
    expected: 'Fresh agent adapts to new MCP capabilities',
    type: 'complex',
    instructions: [
      'Start with v1.0, test 1+1+1 (2 calls)',
      'Stop agent',
      'Stop v1.0 services manually',
      'Start v1.1 services manually',
      'Start NEW agent',
      'Test 1+1+1 command',
      'Observe: Uses 1 call (proper adaptation)'
    ]
  },
  7: {
    name: 'Rollback Scenario (v1.1 → v1.0) - CRITICAL BUG',
    version: 'v1.1',
    command: '1+1+1',
    expected: 'CRITICAL: Result = 2 instead of 3 (parameter c ignored)',
    type: 'complex',
    instructions: [
      'Start with v1.1, test 1+1+1=3 (works correctly)',
      'Keep agent running',
      'Stop v1.1 services manually',
      'Start v1.0 services manually',
      'Test same 1+1+1 command',
      'Observe: Result = 2 (CRITICAL BUG - parameter c ignored!)'
    ]
  }
};

function killProcesses() {
  return new Promise((resolve) => {
    const killCmd = os.platform() === 'win32' 
      ? 'powershell "Get-NetTCPConnection -LocalPort 4000,4001,4002,4003 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"'
      : 'lsof -ti :4000,:4001,:4002,:4003 | xargs -r kill -9';
    
    exec(killCmd, () => {
      console.log('🧹 Cleaned up existing processes');
      resolve();
    });
  });
}

function startServices(version) {
  console.log(`🚀 Starting ${version} services...`);
  const services = spawn('npm', ['run', `start-${version}`], {
    stdio: 'inherit',
    shell: true
  });
  
  return services;
}

async function runScenario(scenarioNum) {
  const scenario = scenarios[scenarioNum];
  if (!scenario) {
    console.error(`❌ Scenario ${scenarioNum} not found`);
    console.log('Available scenarios:');
    Object.entries(scenarios).forEach(([num, s]) => {
      console.log(`  ${num}. ${s.name}`);
    });
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📋 SCENARIO ${scenarioNum}: ${scenario.name}`);
  console.log('='.repeat(60));
  console.log(`🎯 Command: ${scenario.command}`);
  console.log(`📝 Expected: ${scenario.expected}`);
  console.log('='.repeat(60));
  
  await killProcesses();
  const services = startServices(scenario.version);
  
  console.log('\n⏳ Waiting 5 seconds for services to start...');
  setTimeout(() => {
    console.log('\n✅ Services should be ready!');
    
    if (scenario.type === 'basic') {
      console.log('\n🔧 Next steps:');
      console.log('   1. Open a new terminal');
      console.log('   2. Run: cd agent && npm run dev');
      console.log(`   3. Send command: ${scenario.command}`);
      console.log(`   4. Verify: ${scenario.expected}`);
    } else {
      console.log('\n🔧 Complex Scenario Instructions:');
      scenario.instructions.forEach((instruction, index) => {
        console.log(`   ${index + 1}. ${instruction}`);
      });
      console.log('\n💡 Note: This scenario requires manual service management');
      console.log('   Use: npm run start-v1 or npm run start-v1.1 in separate terminals');
    }
    
    console.log('\n⏹️  Press Ctrl+C to stop services when done');
  }, 5000);
  
  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping services...');
    services.kill('SIGTERM');
    process.exit(0);
  });
}

// Get scenario number from command line args
const scenarioNum = process.argv[2];

if (!scenarioNum) {
  console.log('🎯 MCP Quick Test Runner');
  console.log('========================');
  console.log('\nUsage: npm run quick-test [scenario-number]');
  console.log('\nAvailable scenarios:');
  Object.entries(scenarios).forEach(([num, scenario]) => {
    console.log(`  ${num}. ${scenario.name}`);
  });
  console.log('\nExample: npm run quick-test 1');
  process.exit(0);
}

runScenario(parseInt(scenarioNum)).catch(console.error);