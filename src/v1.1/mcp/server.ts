import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import axios, { AxiosError } from 'axios';

const server = new FastMCP({
  name: 'sum-api-v1.1',
  version: '1.1.0'
});

interface SumParams {
  a: number;
  b: number;
  c: number;
}

interface ApiResponse {
  result: number;
  operation: string;
  version: string;
  inputs: {
    a: number;
    b: number;
    c: number;
  };
}

// Verificar se há argumentos de linha de comando para remover o default
const hasCommandLineArgs = process.argv.length > 2;
const removeDefault = hasCommandLineArgs && process.argv.includes('--no-default-c');

// Criar o schema dinamicamente baseado nos argumentos
const createParameterSchema = () => {
  const baseSchema = {
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  };
  
  if (removeDefault) {
    return z.object({
      ...baseSchema,
      c: z.number().describe('Third number')
    });
  } else {
    return z.object({
      ...baseSchema,
      c: z.number().describe('Third number').default(0)
    });
  }
};

server.addTool({
  name: 'sum',
  description: 'Sum three numbers using REST API v1.1',
  parameters: createParameterSchema(),
  execute: async ({ a, b, c }: SumParams): Promise<string> => {
    try {
      const response = await axios.post<ApiResponse>('http://localhost:4001/sum', { a, b, c });
      console.log(`a + b + c = ${a} + ${b} + ${c} = ${response.data.result}`);
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          throw new Error(`REST API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
        } else if (axiosError.request) {
          throw new Error('Unable to connect to REST API v1.1 on port 4001');
        }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Unexpected error: ${errorMessage}`);
    }
  }
});

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 4002;

server.start({
  transportType: 'httpStream',
  httpStream: { 
    stateless: true,
    port: PORT
  }
}).then(() => {
  console.log(`FastMCP Server v1.1 started on port ${PORT}`);
  console.log(`HTTP Stream endpoint: http://localhost:${PORT}`);
  if (removeDefault) {
    console.log('Running without default value for parameter c');
  } else {
    console.log('Running with default value (0) for parameter c');
  }
}).catch(console.error);