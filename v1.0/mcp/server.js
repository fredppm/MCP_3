import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import axios from 'axios';

const server = new FastMCP({
  name: 'sum-api-v1.0',
  version: '1.0.0'
});

server.addTool({
  name: 'sum',
  description: 'Soma dois números usando a API REST v1.0',
  parameters: z.object({
    a: z.number().describe('Primeiro número'),
    b: z.number().describe('Segundo número')
  }),
  execute: async ({ a, b }) => {
    try {
      const response = await axios.post('http://localhost:4000/sum', { a, b });
      console.log(`a + b = ${a} + ${b} = ${response.data}` )
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro da API REST: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Não foi possível conectar à API REST v1.0 na porta 4000');
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
}).catch(console.error);