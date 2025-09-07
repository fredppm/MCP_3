import express from 'express';

const app = express();
const PORT = 4000;

app.use(express.json());

app.post('/sum', (req, res) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({ 
        error: 'Both a and b must be numbers',
        version: '1.0'
      });
    }
    
    const result = a + b;
    
    res.json({ 
      result,
      operation: 'a + b',
      version: '1.0',
      inputs: { a, b }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '1.0' });
});

app.listen(PORT, () => {
  console.log(`REST API v1.0 rodando na porta ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/sum`);
});