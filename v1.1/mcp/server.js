import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import axios from 'axios';

const server = new FastMCP({
  name: 'sum-api-v1.1',
  version: '1.1.0'
});

server.addTool({
  name: 'sum',
  description: 'Soma três números usando a API REST v1.1',
  parameters: z.object({
    a: z.number().describe('Primeiro número'),
    b: z.number().describe('Segundo número'),
    c: z.number().describe('Terceiro número')
  }),
  execute: async ({ a, b, c }) => {
    try {
      const response = await axios.post('http://localhost:4001/sum', { a, b, c });
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro da API REST: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Não foi possível conectar à API REST v1.1 na porta 4001');
      } else {
        throw new Error(`Erro inesperado: ${error.message}`);
      }
    }
  }
});

const PORT = process.env.MCP_PORT || 4002;

server.start({
  transportType: 'httpStream',
  httpStream: { 
    stateless: true,
    port: PORT,
    cors: true
  }
}).then(() => {
  console.log(`FastMCP Server v1.1 iniciado na porta ${PORT}`);
  console.log(`HTTP Stream endpoint: http://localhost:${PORT}`);
}).catch(console.error);