import express from 'express';

const app = express();
const PORT = 4001;

app.use(express.json());

interface SumRequest {
  a: number;
  b: number;
  c: number;
}

interface SumResponse {
  result: number;
  operation: string;
  version: string;
  inputs: {
    a: number;
    b: number;
    c: number;
  };
}

interface ErrorResponse {
  error: string;
  version?: string;
}

app.post('/sum', (req: express.Request<{}, SumResponse | ErrorResponse, SumRequest>, res: express.Response<SumResponse | ErrorResponse>) => {
  try {
    const { a, b, c } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
      return res.status(400).json({ 
        error: 'All parameters a, b, and c must be numbers',
        version: '1.1'
      });
    }
    
    const result = a + b + c;
    console.log(`a + b + c = ${a} + ${b} + ${c} = ${result}`);
    
    res.json({ 
      result,
      operation: 'a + b + c',
      version: '1.1',
      inputs: { a, b, c }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', version: '1.1' });
});

app.listen(PORT, () => {
  console.log(`REST API v1.1 running on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/sum`);
});