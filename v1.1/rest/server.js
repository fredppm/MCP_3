import express from 'express';

const app = express();
const PORT = 4001;

app.use(express.json());

app.post('/sum', (req, res) => {
  try {
    const { a, b, c } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
      return res.status(400).json({ 
        error: 'All parameters a, b, and c must be numbers',
        version: '1.1'
      });
    }
    
    const result = a + b + c;
    
    res.json({ 
      result,
      operation: 'a + b + c',
      version: '1.1',
      inputs: { a, b, c }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '1.1' });
});

app.listen(PORT, () => {
  console.log(`REST API v1.1 rodando na porta ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/sum`);
});