#!/usr/bin/env node

/**
 * Interactive MCP Server Evolution Testing Scenarios
 * Main entry point with interactive scenario selection
 */

import { select, confirm } from '@inquirer/prompts';
import { scenario1 } from './scenario-1.ts';
import { scenario2 } from './scenario-2.ts';
import { scenario3 } from './scenario-3.ts';
import { scenario3_1 } from './scenario-3-1.ts';
import { scenario4 } from './scenario-4.ts';
import { scenario5 } from './scenario-5.ts';
import { scenario6 } from './scenario-6.ts';
import { scenario7 } from './scenario-7.ts';

interface Scenario {
  id: string;
  name: string;
  description: string;
  execute: () => Promise<void>;
}

const scenarios: Scenario[] = [
  {
    id: '1',
    name: 'v1.0 Basic Operation (1+1)',
    description: 'Test basic functionality with v1.0 - single MCP call',
    execute: scenario1
  },
  {
    id: '2', 
    name: 'v1.0 Chain Operation (1+1+1)',
    description: 'Test v1.0 with 3-number request - chained MCP calls',
    execute: scenario2
  },
  {
    id: '3',
    name: 'v1.1 Breaking Change (1+1)',
    description: 'Test v1.1 contract mismatch - initial failure scenario',
    execute: scenario3
  },
  {
    id: '3.1',
    name: 'v1.1 with default value (Avoiding Breaking Changes)',
    description: 'Test proper MCP evolution without breaking changes',
    execute: scenario3_1
  },
  {
    id: '4',
    name: 'v1.1 Optimal Operation (1+1+1)',
    description: 'Test v1.1 with 3-number request - single MCP call',
    execute: scenario4
  },
  {
    id: '5',
    name: 'Hot-Swap Runtime (v1.0 → v1.1)',
    description: 'Test version change during runtime - agent adaptation',
    execute: scenario5
  },
  {
    id: '6',
    name: 'Agent Restart During Version Change',
    description: 'Test fresh agent adaptation to new MCP capabilities',
    execute: scenario6
  },
  {
    id: '7',
    name: 'Rollback Scenario (v1.1 → v1.0) - Critical Bug',
    description: 'Test rollback issues - parameter mismatch problems',
    execute: scenario7
  }
];

async function main() {
  console.log('🎯 MCP Server Evolution Testing - Interactive Scenarios');
  console.log('=' .repeat(60));
  console.log();
  
  // Test colors
  const colors = {
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`
  };
  
  console.log('🎨 Color Legend:');
  console.log(colors.blue('   🔵 Agent logs will be BLUE'));
  console.log(colors.green('   🟢 REST API logs will be GREEN'));
  console.log(colors.yellow('   🟡 MCP Server logs will be YELLOW'));
  console.log(colors.red('   🔴 Error logs will be RED'));
  console.log();

  while (true) {
    try {
      const action = await select({
        message: 'What would you like to do?',
        choices: [
          {
            name: '🚀 Run a specific scenario',
            value: 'run-scenario'
          },
          {
            name: '📋 Run all scenarios sequentially',
            value: 'run-all'
          },
          {
            name: '❓ Show scenario details',
            value: 'show-details'
          },
          {
            name: '🚪 Exit',
            value: 'exit'
          }
        ]
      });

      if (action === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      if (action === 'run-scenario') {
        await runSingleScenario();
      } else if (action === 'run-all') {
        await runAllScenarios();
      } else if (action === 'show-details') {
        await showScenarioDetails();
      }

      console.log();
      const continueChoice = await confirm({
        message: 'Would you like to continue?',
        default: true
      });

      if (!continueChoice) {
        console.log('👋 Goodbye!');
        break;
      }
      console.log();
    } catch (error: any) {
      if (error?.name === 'ExitPromptError') {
        console.log('\n👋 Goodbye!');
        break;
      }
      console.error('❌ Error:', error?.message || error);
    }
  }
}

async function runSingleScenario() {
  const scenarioChoice = await select({
    message: 'Select a scenario to run:',
    choices: scenarios.map(scenario => ({
      name: `${scenario.id}. ${scenario.name}`,
      value: scenario.id,
      description: scenario.description
    }))
  });

  const selectedScenario = scenarios.find(s => s.id === scenarioChoice);
  if (selectedScenario) {
    await selectedScenario.execute();
  }
}

async function runAllScenarios() {
  console.log('\n🎬 Running All Scenarios Sequentially');
  console.log('=' .repeat(60));
  
  for (const scenario of scenarios) {
    console.log(`\n▶️  Starting Scenario ${scenario.id}: ${scenario.name}`);
    console.log('-' .repeat(40));
    
    try {
      await scenario.execute();
      console.log(`✅ Scenario ${scenario.id} completed successfully!`);
    } catch (error) {
      console.error(`❌ Scenario ${scenario.id} failed:`, error);
      
      const continueChoice = await confirm({
        message: 'Continue with next scenario?',
        default: true
      });
      
      if (!continueChoice) {
        break;
      }
    }
    
    if (scenario !== scenarios[scenarios.length - 1]) {
      const continueChoice = await confirm({
        message: 'Continue to next scenario?',
        default: true
      });
      
      if (!continueChoice) {
        break;
      }
    }
  }
  
  console.log('\n🏁 All scenarios execution completed!');
}

async function showScenarioDetails() {
  const scenarioChoice = await select({
    message: 'Select a scenario to view details:',
    choices: scenarios.map(scenario => ({
      name: `${scenario.id}. ${scenario.name}`,
      value: scenario.id
    }))
  });

  const selectedScenario = scenarios.find(s => s.id === scenarioChoice);
  if (selectedScenario) {
    console.log(`\n📋 Scenario ${selectedScenario.id} Details`);
    console.log('=' .repeat(40));
    console.log(`Name: ${selectedScenario.name}`);
    console.log(`Description: ${selectedScenario.description}`);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🧹 Cleaning up and exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🧹 Cleaning up and exiting...');
  process.exit(0);
});

main().catch(console.error);