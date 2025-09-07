# Ambiente de Teste - Migração MCP API

Este projeto demonstra como testar a migração entre versões de uma API usando o protocolo MCP (Model Context Protocol).

## Estrutura do Projeto

```
├── v1.0/
│   ├── rest/server.js     # API REST v1.0 (soma A + B)
│   └── mcp/server.js      # Servidor MCP v1.0
├── v1.1/
│   ├── rest/server.js     # API REST v1.1 (soma A + B + C)
│   └── mcp/server.js      # Servidor MCP v1.1
├── scripts/
│   └── automation.js     # Script de automação dos testes
├── mcp-configs/          # Configurações para mcp-inspector
└── package.json
```

## Como Usar

### 1. Instalação
```bash
npm install
npm install -g @modelcontextprotocol/inspector
```

### 2. Execução Automatizada
```bash
npm start
```

### 3. Teste Manual

#### Iniciar servidores individualmente:
```bash
# Terminal 1 - API v1.0
npm run rest-v1

# Terminal 2 - MCP v1.0
npm run mcp-v1
```

#### Testar com mcp-inspector:
```bash
npx @modelcontextprotocol/inspector node v1.0/mcp/server.js
```

## Cenários de Teste

### Versão 1.0
- **Endpoint**: `POST /sum`
- **Payload**: `{"a": 1, "b": 2}`
- **Resultado esperado**: `{"result": 3, "version": "1.0"}`
- **Ferramenta MCP**: `sum_two_numbers`

### Versão 1.1
- **Endpoint**: `POST /sum`
- **Payload**: `{"a": 1, "b": 2, "c": 3}`
- **Resultado esperado**: `{"result": 6, "version": "1.1"}`
- **Ferramenta MCP**: `sum_three_numbers`

### Teste de Compatibilidade
- Usar payload v1.0 `{"a": 1, "b": 2}` no servidor v1.1
- **Resultado esperado**: Erro por parâmetro `c` ausente

## Portas Utilizadas
- **REST v1.0**: `4000`
- **REST v1.1**: `4001`
- **MCP**: Comunicação via stdio

## Comandos Úteis

```bash
# Verificar portas em uso
netstat -an | findstr :4000
netstat -an | findstr :4001

# Matar processos se necessário
taskkill /f /pid <PID>
```