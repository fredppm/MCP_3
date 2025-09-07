import { spawn, exec } from 'child_process';
import os, { type } from 'os';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

console.log('🔄 INICIANDO VALIDAÇÃO DE MIGRAÇÃO v1.0 → v1.1');
console.log('==================================================');

// FastMCP Client Functions
async function createMCPClient(version) {
  const client = new Client(
    {
      name: `migration-test-client-v${version}`,
      version: version
    },
    {
      capabilities: {}
    }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:4002/mcp')
  );

  await client.connect(transport);
  return client;
}

async function listToolsNative(client) {
  try {
    const result = await client.listTools();
    return result;
  } catch (error) {
    throw new Error(`Failed to list tools: ${error.message}`);
  }
}

async function callToolNative(client, name, args) {
  try {
    const result = await client.callTool({
      name,
      arguments: args
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to call tool ${name}: ${error.message}`);
  }
}

async function requestSum(client, args) {
  try {
    client.requestSampling({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Sum " + Object.keys(args).map(k => args[k]).join(", ")
          }
        }
      ],
      systemPromt: "You are a calculator assistant.",
      includeContext: "thisServer",
      maxTokens: 100,
    })
  } catch (error) {
    throw new Error(`Failed to call tool sum: ${error.message}`);
  }
}

let currentServers = null;
let client = null;

// Function to kill existing processes
function killExistingProcesses() {
  return new Promise((resolve) => {
    const killCmd = os.platform() === 'win32' 
      ? 'powershell "Get-NetTCPConnection -LocalPort 4000,4001,4002,4003 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 2"'
      : 'lsof -ti :4000,:4001,:4002,:4003 | xargs -r kill -9; sleep 2';

    exec(killCmd, () => {
      console.log('🧹 Limpeza de processos concluída');
      setTimeout(resolve, 1000);
    });
  });
}

// Function to run MCP native client tests with existing client
async function runNativeClientTest(client, version, toolArgs) {
  try {
    console.log(`\n📋 Testando MCP v${version} com conexão persistente...`);
    
    // List tools
    console.log(`\n=== TOOLS LIST v${version} (Persistent Connection) ===`);
    const toolsList = await listToolsNative(client);
    console.log(JSON.stringify(toolsList, null, 2));
    
    // Call tool
    console.log(`\n🔧 Executando tool da versão ${version}...`);
    console.log(`\n=== TOOL CALL v${version} (Persistent Connection) ===`);
    const toolResult = await callToolNative(client, 'sum', toolArgs);
    console.log(JSON.stringify(toolResult, null, 2));
    
    // Extract result for validation
    let resultText = '';
    if (toolResult.content && toolResult.content[0] && toolResult.content[0].text) {
      resultText = toolResult.content[0].text;
    }
    
    return { 
      err: null, 
      stdout: resultText, 
      stderr: null,
      toolsList,
      toolResult
    };
    
  } catch (error) {
    console.error(`\n❌ Erro no teste v${version}:`, error.message);
    return { 
      err: error, 
      stdout: null, 
      stderr: error.message 
    };
  }
}

// Function to start servers and wait
function startServers(version) {
  return new Promise((resolve) => {
    console.log(`\n🚀 Iniciando servidores v${version}...`);
    
    const startScript = version === '1.0' ? 'start-v1' : 'start-v1.1';
    currentServers = spawn('npm', ['run', startScript], {
      stdio: 'inherit',
      shell: true,
      env: {
        MCP_PORT: 4002
      }
    });

    // Wait for servers to start
    setTimeout(() => {
      console.log(`✅ Servidores v${version} iniciados`);
      resolve();
    }, version === '1.0' ? 5000 : 8000); // v1.1 needs more time
  });
}

// Function to stop current servers
function stopServers() {
  return new Promise((resolve) => {
    if (currentServers) {
      console.log('\n⏹️  Parando servidores...');
      currentServers.kill('SIGTERM');
      setTimeout(() => {
        resolve();
      }, 2000);
    } else {
      resolve();
    }
  });
}

async function runMigrationValidation() {
  
  try {
    // Initial cleanup
    await killExistingProcesses();

    // ========== FASE 1: TESTE v1.0 ==========
    console.log('\n📦 FASE 1: TESTANDO VERSÃO 1.0');
    console.log('================================');
    
    await startServers('1.0');
    // Wait a bit for v1.0 to be fully ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ========== CRIANDO CONEXÃO PERSISTENTE ==========
    console.log('\n🔗 CRIANDO CONEXÃO MCP PERSISTENTE');
    console.log('===================================');
    client = await createMCPClient('migration-test');
    console.log('✅ Cliente MCP criado - será reutilizado durante toda a migração');
    
    const v1Results = await runNativeClientTest(client, '1.0', { a: 5, b: 10 });
    
    await stopServers();
    await killExistingProcesses();

    // ========== FASE 2: TESTE v1.1 ==========
    console.log('\n📦 FASE 2: TESTANDO VERSÃO 1.1');
    console.log('================================');
    console.log('🔄 Reutilizando a mesma conexão MCP para v1.1...');
    
    await startServers('1.1');
    // Wait a bit for v1.1 to be fully ready  
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const v11Results = await runNativeClientTest(client, '1.1', { a: 5, b: 10, c: 15 });
    
    await stopServers();
    await killExistingProcesses();

    // ========== RELATÓRIO FINAL ==========
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO');
    console.log('========================');
    
    const v1Success = !v1Results.err && v1Results.stdout && v1Results.stdout.includes('15');
    const v11Success = !v11Results.err && v11Results.stdout && v11Results.stdout.includes('30');
    
    console.log(`v1.0: ${v1Success ? '✅ SUCESSO' : '❌ FALHOU'} - Soma de 2 números (5+10=15)`);
    console.log(`v1.1: ${v11Success ? '✅ SUCESSO' : '❌ FALHOU'} - Soma de 3 números (5+10+15=30)`);
    
    if (v1Success && v11Success) {
      console.log('\n🎉 MIGRAÇÃO VALIDADA COM SUCESSO!');
      console.log('   - v1.0 funcionando corretamente');
      console.log('   - v1.1 funcionando corretamente'); 
      console.log('   - Terceiro parâmetro implementado com sucesso');
      console.log('   - ✨ CONEXÃO MCP PERSISTENTE mantida durante toda a migração');
      process.exit(0);
    } else {
      console.log('\n❌ PROBLEMAS DETECTADOS NA MIGRAÇÃO');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 ERRO DURANTE VALIDAÇÃO:', error.message);
    await stopServers();
    await killExistingProcesses();
    process.exit(1);
  } finally {
    // Close persistent client connection
    if (client) {
      try {
        await client.close();
        console.log('🔌 Conexão MCP persistente fechada');
      } catch (closeError) {
        console.error('Warning: Erro ao fechar cliente persistente:', closeError.message);
      }
    }
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrompido pelo usuário');
  if (client) {
    try {
      await client.close();
      console.log('🔌 Conexão persistente fechada');
    } catch (e) {
      console.error('Erro ao fechar cliente:', e.message);
    }
  }
  await stopServers();
  await killExistingProcesses();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (client) {
    try {
      await client.close();
    } catch (e) {
      console.error('Erro ao fechar cliente:', e.message);
    }
  }
  await stopServers();
  await killExistingProcesses();
  process.exit(0);
});

// Start validation
runMigrationValidation();