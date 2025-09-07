# Multi-Agent System em Node.js
## Inspirado no PraisonAI + AWS Bedrock + MCP

Sistema multi-agente em Node.js que combina:
- **AWS Bedrock** (Claude) como LLM principal
- **MCP v1.0 e v1.1** para operações matemáticas  
- **Arquitetura multi-agente** inspirada no PraisonAI
- **Workflow engine** para processos estruturados

## Arquitetura

### Agentes Especializados

1. **CoordinatorAgent** - Analisa requisições e decide roteamento
2. **MathAnalystAgent** - Especialista em análise matemática
3. **MCPExecutorAgent** - Executa operações via MCP servers
4. **PresenterAgent** - Formata resultados usando IA

### Fluxo de Trabalho

```
Usuário → Coordinator → Math Analyst → MCP Executor → Presenter → Resultado
```

## Componentes

### `multi-agent.js`
Sistema principal com todos os agentes especializados.

**Classe MultiAgentSystem:**
- Inicializa conexões MCP e Bedrock
- Orquestra colaboração entre agentes
- Processa requisições do usuário

### `cli.js` 
Interface de linha de comando básica.

**Recursos:**
- Chat interativo
- Status do sistema
- Comandos de ajuda
- Shutdown graceful

### `advanced-cli.js`
Interface avançada com modos de processamento.

**Recursos:**
- **Modo Direct**: Comunicação direta entre agentes
- **Modo Workflow**: Processamento via workflow engine
- **Logging verbose**: Para debug detalhado
- **Comandos avançados**: /mode, /verbose, /workflows

### `workflow-engine.js`
Engine para definir e executar workflows estruturados.

**Recursos:**
- Definição de workflows com steps
- Execução sequencial ou paralela
- Event emitters para monitoramento
- Workflows pré-definidos para matemática

## Instalação e Uso

### Pré-requisitos

1. **AWS Bedrock configurado:**
   ```bash
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   export AWS_REGION=us-east-1
   ```

2. **MCP Servers rodando:**
   ```bash
   npm run start-v1    # MCP v1.0 (porta 4002)
   npm run start-v1.1  # MCP v1.1 (porta 4003)
   ```

### Execução

#### Interface Básica
```bash
npm run agent-multi
```

#### Interface Avançada
```bash
npm run agent-advanced
```

## Exemplos de Uso

### Interface Básica
```
🧑 You: sum 15 and 25
🎯 Processing through multi-agent system...
🤖 Coordinator: Mathematical sum operation detected
🔢 Math Analyst: 2 numbers detected, using MCP v1.0
⚡ MCP Executor: MCP v1.0 execution successful
📋 Presenter: Result formatted

🤖 System: ✅ The calculation has been completed successfully! Using MCP v1.0, I calculated 15 + 25 = 40. The system performed the addition operation as requested.
⏱️  Processed in 2341ms
```

### Interface Avançada - Modo Direct
```
🎯 You: calculate 10 + 20 + 30
🎯 Processing in DIRECT mode...

🤖 System: ✅ Perfect! Using MCP v1.1, I calculated the sum of your three numbers: 10 + 20 + 30 = 60. The system successfully processed this as a three-parameter addition operation.
⏱️  Processed in 1876ms
```

### Interface Avançada - Modo Workflow
```
🔄 You: /mode workflow
🔧 Mode switched to: WORKFLOW

🔄 You: sum 5 and 7
🔄 Processing in WORKFLOW mode...
🔄 Workflow: mathOperation (4 steps)

🤖 System: ✅ Using the mathematical workflow, I calculated 5 + 7 = 12 via MCP v1.0. The operation was completed through our structured four-step process.
⏱️  Processed in 3102ms
```

### Comandos Avançados
```
🔄 You: /verbose on
🔊 Verbose logging: ON

🔄 You: /workflows
🔄 Available Workflows:
   1. mathOperation (4 steps)
      1. analyze_request
      2. math_analysis  
      3. execute_calculation
      4. present_result
   2. parallelMathOperation (2 steps)
      1. parallel_analysis
      2. execute_best_path

🔄 You: /status
📊 Advanced System Status:
   Mode: WORKFLOW
   Verbose: ON
   MCP v1.0: ✅ Connected
   MCP v1.1: ✅ Connected
   AWS Bedrock: ✅ Connected
   Active Workflows: 0
```

## Vantagens sobre a Implementação Simples

1. **Especialização**: Cada agente tem responsabilidade específica
2. **Flexibilidade**: Dois modos de processamento (direct/workflow) 
3. **Observabilidade**: Logging detalhado e monitoramento
4. **Escalabilidade**: Fácil adicionar novos agentes/workflows
5. **Robustez**: Tratamento de erros por camada

## Conectividade AWS Bedrock

### Configuração
O sistema usa o SDK oficial da AWS para Bedrock:
- **Modelo padrão**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Região padrão**: `us-east-1`
- **Autenticação**: Via credenciais AWS padrão

### Customização
```javascript
const system = new MultiAgentSystem({
  region: 'us-west-2',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
});
```

### Variáveis de Ambiente
```bash
export AWS_REGION=us-east-1
export BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Comparação: PraisonAI vs Implementação Node.js

| Aspecto | PraisonAI (Python) | Nossa Implementação (Node.js) |
|---------|-------------------|-------------------------------|
| **Linguagem** | Python | JavaScript/Node.js |
| **Framework** | PraisonAI Framework | Custom Multi-Agent System |
| **LLM Backend** | 100+ LLMs (incluindo Bedrock) | AWS Bedrock (Claude) |
| **Agentes** | YAML-defined roles | Class-based specialized agents |
| **Workflows** | Built-in workflow patterns | Custom workflow engine |
| **MCP Integration** | ❓ (não documentado) | ✅ Nativo v1.0 e v1.1 |
| **Observabilidade** | Framework logging | Custom events + verbose mode |
| **Deployment** | pip install + config | npm + AWS SDK |

## Próximos Passos

1. **Adicionar mais agentes especializados**
2. **Implementar workflows paralelos** 
3. **Integrar com mais providers LLM**
4. **Dashboard web para monitoramento**
5. **Persistência de workflows e resultados**

A implementação Node.js oferece controle total sobre o sistema multi-agente, mantendo a simplicidade de uso e integração nativa com o ecossistema MCP existente.