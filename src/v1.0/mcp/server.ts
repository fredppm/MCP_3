import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import axios, { AxiosError } from 'axios';

const server = new FastMCP({
  name: 'sum-api-v1.0',
  version: '1.0.0'
});

interface SumParams {
  a: number;
  b: number;
}

interface ApiResponse {
  result: number;
  operation: string;
  version: string;
  inputs: {
    a: number;
    b: number;
  };
}

server.addTool({
  name: 'sum',
  description: 'Adds two numbers using the REST API v1.0',
  parameters: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }),
  execute: async ({ a, b }: SumParams): Promise<string> => {
    try {
      const response = await axios.post<ApiResponse>('http://localhost:4000/sum', { a, b });
      console.log(`a + b = ${a} + ${b} = ${response.data.result}`);
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          throw new Error(`API REST error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
        } else if (axiosError.request) {
          throw new Error('Unable to connect to REST API v1.0 on port 4000');
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
}).catch(console.error);