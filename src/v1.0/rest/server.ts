import express from 'express';

const app = express();
const PORT = 4000;

app.use(express.json());

interface SumRequest {
  a: number;
  b: number;
}

interface SumResponse {
  result: number;
  operation: string;
  version: string;
  inputs: {
    a: number;
    b: number;
  };
}

interface ErrorResponse {
  error: string;
  version?: string;
}

app.post('/sum', (req: express.Request<{}, SumResponse | ErrorResponse, SumRequest>, res: express.Response<SumResponse | ErrorResponse>) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({ 
        error: 'Both a and b must be numbers',
        version: '1.0'
      });
    }
    
    const result = a + b;
    console.log(`a + b = ${a} + ${b} = ${result}`);
    
    res.json({ 
      result,
      operation: 'a + b',
      version: '1.0',
      inputs: { a, b }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', version: '1.0' });
});

app.listen(PORT, () => {
  console.log(`REST API v1.0 running on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/sum`);
});