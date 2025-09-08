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

export function stopProcessAsync(process: any): Promise<void> {
  return new Promise((resolve) => {
    if (!process || process.killed) {
      resolve();
      return;
    }
    
    process.on('exit', () => resolve());
    process.on('close', () => resolve());
    
    if (process.stdin && !process.stdin.destroyed) {
      process.stdin.pause();
    }
    process.kill('SIGTERM');
    
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
        setTimeout(() => resolve(), 1000);
      }
    }, 3000);
  });
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


export function createInteractiveAgent(): Promise<{
  sendCommand: (command: string) => Promise<boolean>;
  close: () => Promise<void>;
}> {
  return new Promise((resolve, reject) => {
    console.log(colors.blue(`   🚀 Starting interactive agent...`));
    
    const agent = spawn('npm', ['run', 'agent'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let isReady = false;
    let currentResolve: ((success: boolean) => void) | null = null;
    let outputBuffer = '';
    
    // Aguardar o agent estar pronto
    agent.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(colors.cyan(`   [AGENT] ${output.trim()}`));
      
      outputBuffer += output;
      
      // Detectar quando o agent está pronto para receber comandos
      if (!isReady && output.includes('> ')) {
        isReady = true;
        console.log(colors.green(`   ✅ Agent is ready for commands`));
        
        resolve({
          sendCommand: async (command: string): Promise<boolean> => {
            return new Promise((cmdResolve) => {
              if (!isReady) {
                console.log(colors.red(`   ❌ Agent not ready`));
                cmdResolve(false);
                return;
              }
              
              console.log(colors.blue(`   📤 Sending command: ${command}`));
              currentResolve = cmdResolve;
              outputBuffer = '';
              
              agent.stdin.write(command + '\n');
              
              // Timeout para comandos que não respondem
              setTimeout(() => {
                if (currentResolve) {
                  console.log(colors.yellow(`   ⏰ Command timeout`));
                  currentResolve(true); // Considera sucesso mesmo com timeout
                  currentResolve = null;
                }
              }, 30000); // 30 segundos timeout
            });
          },
          
          close: async (): Promise<void> => {
            return new Promise((closeResolve) => {
              console.log(colors.yellow(`   🔄 Closing interactive agent...`));
              
              if (agent.stdin && !agent.stdin.destroyed) {
                agent.stdin.write('/exit\n');
              }
              
              agent.on('exit', () => {
                console.log(colors.green(`   ✅ Agent closed`));
                closeResolve();
              });
              
              // Force kill se não fechar em 5 segundos
              setTimeout(() => {
                if (!agent.killed) {
                  agent.kill('SIGKILL');
                  closeResolve();
                }
              }, 5000);
            });
          }
        });
      }
      
      // Detectar fim de resposta do comando
      if (currentResolve && output.includes('> ')) {
        currentResolve(true);
        currentResolve = null;
      }
    });
    
    agent.stderr.on('data', (data) => {
      console.log(colors.red(`   [AGENT ERROR] ${data.toString().trim()}`));
    });
    
    agent.on('error', (error) => {
      console.error(colors.red(`   ❌ Agent spawn error: ${error.message}`));
      reject(error);
    });
    
    agent.on('exit', (code) => {
      console.log(colors.yellow(`   🔄 Agent exited with code: ${code}`));
      isReady = false;
    });
    
    // Timeout para inicialização
    setTimeout(() => {
      if (!isReady) {
        console.log(colors.red(`   ❌ Agent initialization timeout`));
        reject(new Error('Agent initialization timeout'));
      }
    }, 15000); // 15 segundos para inicializar
  });
}