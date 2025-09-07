import { spawn, exec } from 'child_process';
import os from 'os';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

console.log('Starting MCP v1.0 test...');

// FastMCP Client Functions
async function createMCPClient() {
  const client = new Client(
    {
      name: 'test-client-v1.0',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:8080/mcp')
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

// Kill any existing processes on ports 4000+
const killCmd = os.platform() === 'win32' 
  ? 'powershell "Get-NetTCPConnection -LocalPort 4000,4001,4002,4003 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 1"'
  : 'lsof -ti :4000,:4001,:4002,:4003 | xargs -r kill -9; sleep 1';

exec(killCmd, (err) => {
  console.log('Cleaned up existing processes');
  // Wait a bit for processes to actually die
  setTimeout(() => {
    startTest();
  }, 2000);
});

function startTest() {

  // Start the servers
  const servers = spawn('npm', ['run', 'start-v1'], {
    stdio: 'inherit',
    shell: true
  });

  setTimeout(async () => {
    console.log('\nStarting tests...');
    
    let client;
    let hasError = false;
    
    try {
      // Connect to MCP server
      client = await createMCPClient();
      console.log('✅ Connected to MCP server');
      
      // Test 1: List tools
      console.log('\n=== TOOLS LIST (Native Client) ===');
      const toolsList = await listToolsNative(client);
      console.log(JSON.stringify(toolsList, null, 2));
      
      // Test 2: Call tool
      console.log('\n=== TOOL CALL (Native Client) ===');
      const toolResult = await callToolNative(client, 'sum', { a: 5, b: 10 });
      console.log(JSON.stringify(toolResult, null, 2));
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      hasError = true;
    } finally {
      // Close client connection if it exists
      if (client) {
        try {
          await client.close();
          console.log('🔌 Client connection closed');
        } catch (closeError) {
          console.error('Warning: Error closing client:', closeError.message);
        }
      }
      
      // Kill servers and exit
      servers.kill('SIGTERM');
      process.exit(hasError ? 1 : 0);
    }
  }, 5000);

  // Handle cleanup
  process.on('SIGINT', () => {
    servers.kill('SIGTERM');
    process.exit(0);
  });

}