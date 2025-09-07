# MCP Agent com AWS Bedrock

Este diretório contém um agente simples que integra o AWS Bedrock com os servidores MCP (v1.0 e v1.1) do projeto.

## Componentes

### `bedrock-client.js`
Cliente para AWS Bedrock que permite invocar modelos Claude via API.

**Recursos:**
- Configuração automática de credenciais AWS
- Suporte a conversas e prompts simples
- Tratamento de erros
- Modelo padrão: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### `mcp-client.js`
Cliente MCP que se conecta aos servidores v1.0 e v1.1.

**Recursos:**
- Suporte a ambas as versões (1.0 e 1.1)
- Conexão automática via HTTP Stream
- Métodos helper para operações matemáticas
- Detecção automática de parâmetros necessários

### `agent.js`
Orquestrador principal que combina Bedrock e MCP.

**Funcionalidades:**
- Interface CLI interativa
- Detecção automática de operações matemáticas
- Roteamento inteligente entre MCP v1.0 e v1.1
- Chat geral via Bedrock
- Histórico de conversação

## Pré-requisitos

### AWS Bedrock
1. Configure suas credenciais AWS:
   ```bash
   aws configure
   # ou use variáveis de ambiente:
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   export AWS_REGION=us-east-1
   ```

2. Certifique-se de ter acesso ao modelo Claude no Bedrock

### MCP Servers
Os servidores MCP devem estar rodando:
```bash
# Terminal 1 - Inicia todos os servidores
npm run start-v1
npm run start-v1.1

# Ou individualmente
npm run rest-v1    # porta 4000
npm run mcp-v1     # porta 4002
npm run rest-v1.1  # porta 4001  
npm run mcp-v1.1   # porta 4003
```

## Como Usar

### Método 1: Ambiente Completo
```bash
# Inicia todos os servidores + agent em uma janela
npm run start-agent-env
```

### Método 2: Agent Separado
```bash
# Terminal 1 - Servidores
npm run start-v1
npm run start-v1.1

# Terminal 2 - Agent
npm run agent
```

### Método 3: Direto
```bash
node agent/agent.js
```

## Exemplos de Uso

```
You: sum 5 and 10
Agent: ✅ Using MCP v1.0: 15 (a + b)

You: sum 1, 2, 3  
Agent: ✅ Using MCP v1.1: 6 (a + b + c)

You: Hello, how are you?
Agent: [resposta via Bedrock Claude]

You: quit
Agent: 👋 MCP Agent shutdown complete
```

## Arquitetura

```
┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   User CLI   │───▶│ MCP Agent   │───▶│   Bedrock   │
└──────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ MCP Clients │
                    └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ MCP v1.0 │  │ MCP v1.1 │
              └──────────┘  └──────────┘
                    │             │
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ REST v1.0│  │ REST v1.1│
              └──────────┘  └──────────┘
```

## Configuração Avançada

### Personalizar modelo Bedrock
```javascript
const agent = new MCPAgent({
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  region: 'us-west-2'
});
```

### Variáveis de Ambiente
```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=bedrock-profile
```

## Troubleshooting

**Erro de conexão MCP:**
- Verifique se os servidores MCP estão rodando
- Confirme as portas 4002 (v1.0) e 4003 (v1.1)

**Erro Bedrock:**
- Verifique credenciais AWS
- Confirme acesso ao modelo no console Bedrock
- Teste com `aws bedrock-runtime list-foundation-models`

**Agent não responde:**
- Verifique conectividade de rede
- Confirme que todos os serviços estão funcionando