/**
 * Utility functions for scenario execution
 */

import { spawn, exec } from 'child_process';
import os from 'os';

// Color functions for console output
const colors = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`
};

export function killProcesses(): Promise<void> {
  return new Promise((resolve) => {
    const killCmd = os.platform() === 'win32' 
      ? 'powershell "Get-NetTCPConnection -LocalPort 4000,4001,4002,4003 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 2"'
      : 'lsof -ti :4000,:4001,:4002,:4003 | xargs -r kill -9; sleep 2';
    
    exec(killCmd, () => {
      resolve();
    });
  });
}

export function executeAgent(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(colors.blue(`   🚀 Running: npm run agent -- "${command}"`));
    const agent = spawn('npm', ['run', 'agent', '--', command], {
      stdio: 'inherit',
      shell: true
    });
    
    agent.on('exit', (code) => {
      resolve(code === 0);
    });
    
    agent.on('error', (error) => {
      console.error(colors.red(`   ❌ Agent error: ${error.message}`));
      resolve(false);
    });
  });
}

export function stopProcess(process: any) {
  if (process && !process.killed) {
    process.kill('SIGTERM');
  }
}

export interface Services {
  rest: any;
  mcp: any;
}

export function startV1Services(): Promise<Services> {
  return new Promise((resolve) => {
    console.log(colors.green('   🌐 Starting REST API v1.0 on port 4000...'));
    const restServer = spawn('npm', ['run', 'rest-v1'], {
      stdio: 'pipe',
      shell: true
    });
    
    restServer.stdout.on('data', (data) => {
      console.log(colors.green(`   [REST v1.0] ${data.toString().trim()}`));
    });
    
    restServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [REST v1.0 ERROR] ${data.toString().trim()}`));
    });
    
    console.log(colors.yellow('   🔧 Starting MCP Server v1.0 on port 4002...'));
    const mcpServer = spawn('npm', ['run', 'mcp-v1'], {
      stdio: 'pipe', 
      shell: true
    });
    
    mcpServer.stdout.on('data', (data) => {
      console.log(colors.yellow(`   [MCP v1.0] ${data.toString().trim()}`));
    });
    
    mcpServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [MCP v1.0 ERROR] ${data.toString().trim()}`));
    });
    
    resolve({
      rest: restServer,
      mcp: mcpServer
    });
  });
}

export function startV11Services(): Promise<Services> {
  return new Promise((resolve) => {
    console.log(colors.green('   🌐 Starting REST API v1.1 on port 4001...'));
    const restServer = spawn('npm', ['run', 'rest-v1.1'], {
      stdio: 'pipe',
      shell: true
    });
    
    restServer.stdout.on('data', (data) => {
      console.log(colors.green(`   [REST v1.1] ${data.toString().trim()}`));
    });
    
    restServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [REST v1.1 ERROR] ${data.toString().trim()}`));
    });
    
    console.log(colors.yellow('   🔧 Starting MCP Server v1.1 on port 4003...'));
    const mcpServer = spawn('npm', ['run', 'mcp-v1.1'], {
      stdio: 'pipe', 
      shell: true
    });
    
    mcpServer.stdout.on('data', (data) => {
      console.log(colors.yellow(`   [MCP v1.1] ${data.toString().trim()}`));
    });
    
    mcpServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [MCP v1.1 ERROR] ${data.toString().trim()}`));
    });
    
    resolve({
      rest: restServer,
      mcp: mcpServer
    });
  });
}

export function startV11ServicesNoDefault(): Promise<Services> {
  return new Promise((resolve) => {
    console.log(colors.green('   🌐 Starting REST API v1.1 on port 4001...'));
    const restServer = spawn('npm', ['run', 'rest-v1.1'], {
      stdio: 'pipe',
      shell: true
    });
    
    restServer.stdout.on('data', (data) => {
      console.log(colors.green(`   [REST v1.1] ${data.toString().trim()}`));
    });
    
    restServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [REST v1.1 ERROR] ${data.toString().trim()}`));
    });
    
    console.log(colors.yellow('   🔧 Starting MCP Server v1.1 with --no-default-c flag...'));
    const mcpServer = spawn('node', ['--loader', 'ts-node/esm', 'src/v1.1/mcp/server.ts', '--no-default-c'], {
      stdio: 'pipe', 
      shell: true
    });
    
    mcpServer.stdout.on('data', (data) => {
      console.log(colors.yellow(`   [MCP v1.1] ${data.toString().trim()}`));
    });
    
    mcpServer.stderr.on('data', (data) => {
      console.log(colors.red(`   [MCP v1.1 ERROR] ${data.toString().trim()}`));
    });
    
    resolve({
      rest: restServer,
      mcp: mcpServer
    });
  });
}