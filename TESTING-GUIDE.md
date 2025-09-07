# Guia de Teste - Migração API v1.0 → v1.1 com MCP

## 📋 Visão Geral

Este projeto demonstra a migração entre duas versões de uma API usando protocolo MCP (Model Context Protocol). Você testará a transição da versão 1.0 (soma de 2 números) para a versão 1.1 (soma de 3 números) usando o MCP Inspector.

## 🏗️ Arquitetura

```
📁 MCP_3/
├── api/
│   ├── v1.0/          # API REST v1.0 (soma A + B)
│   └── v1.1/          # API REST v1.1 (soma A + B + C)
├── mcp/
│   ├── v1.0/          # Servidor MCP v1.0
│   └── v1.1/          # Servidor MCP v1.1
├── start-v1.0.bat     # Script para iniciar v1.0
├── start-v1.1.bat     # Script para iniciar v1.1
└── stop-all.bat       # Script para parar todos os serviços
```

## 🚀 Como Executar o Teste

### Passo 1: Preparação
1. Abra um terminal/PowerShell no diretório do projeto
2. Certifique-se de que todas as dependências estão instaladas

### Passo 2: Testando a Versão 1.0

1. **Inicie o ambiente v1.0:**
   ```bash
   # Execute o script de inicialização
   start-v1.0.bat
   ```

2. **Serviços que serão iniciados:**
   - **API REST v1.0:** `http://localhost:4000`
   - **MCP Server v1.0:** `http://localhost:4001`
   - **URL para MCP Inspector:** `http://localhost:4001/sse`

3. **Abra o MCP Inspector:**
   - Vá para: https://inspector.anthropic.com/ (oficial)
   - Configure a URL: `http://localhost:4001/sse`
   - Conecte ao servidor

4. **Teste a funcionalidade v1.0:**
   - **Tool disponível:** `sum_two_numbers`
   - **Parâmetros:** `a` e `b` (números)
   - **Exemplo:** `{ "a": 5, "b": 10 }`
   - **Resultado esperado:** `15`

### Passo 3: Migração para v1.1

1. **Pare todos os serviços:**
   ```bash
   stop-all.bat
   ```

2. **Inicie o ambiente v1.1:**
   ```bash
   start-v1.1.bat
   ```

3. **Serviços que serão iniciados:**
   - **API REST v1.1:** `http://localhost:4000`
   - **MCP Server v1.1:** `http://localhost:4002`
   - **URL para MCP Inspector:** `http://localhost:4002/sse`

4. **No MCP Inspector (que deve continuar aberto):**
   - **Desconecte** da URL antiga
   - **Reconecte** usando: `http://localhost:4002/sse`

5. **Teste a funcionalidade v1.1:**
   - **Tool disponível:** `sum_three_numbers`
   - **Parâmetros:** `a`, `b` e `c` (números)
   - **Exemplo:** `{ "a": 5, "b": 10, "c": 15 }`
   - **Resultado esperado:** `30`

## 🔗 URLs de Teste Direto

### Versão 1.0
- **API REST:** `GET http://localhost:4000/api/v1.0/sum/5/10`
- **MCP Server:** `http://localhost:4001`
- **Teste Local:** `http://localhost:4001/` (interface web)

### Versão 1.1
- **API REST:** `GET http://localhost:4000/api/v1.1/sum/5/10/15`
- **MCP Server:** `http://localhost:4002`
- **Teste Local:** `http://localhost:4002/` (interface web)

## 🧪 Casos de Teste

### Teste 1: Funcionalidade Básica v1.0
```json
Tool: sum_two_numbers
Input: { "a": 5, "b": 10 }
Expected: "Resultado da soma: 5 + 10 = 15\nResultado: 15"
```

### Teste 2: Funcionalidade Básica v1.1
```json
Tool: sum_three_numbers  
Input: { "a": 5, "b": 10, "c": 15 }
Expected: "Resultado da soma: 5 + 10 + 15 = 30\nResultado: 30"
```

### Teste 3: Migração Comportamental
- **Objetivo:** Demonstrar que o mesmo MCP Inspector pode conectar com diferentes versões
- **Procedimento:** Alternar entre v1.0 e v1.1 sem fechar o Inspector
- **Expectativa:** Tools diferentes disponíveis em cada versão

## 🎯 Objetivos do Teste

1. **Validar migração:** Demonstrar transição suave entre versões
2. **Testar compatibilidade:** MCP Inspector funciona com ambas as versões
3. **Verificar funcionalidade:** Cada versão executa suas operações corretamente
4. **Simular produção:** Processo realista de upgrade de API

## 🔧 Troubleshooting

### Problema: Porta ocupada
- **Solução:** Execute `stop-all.bat` e tente novamente

### Problema: MCP Inspector não conecta
- **Verificação:** Certifique-se de que o servidor MCP está rodando
- **URL:** Verifique se está usando a URL correta (`/sse` no final)

### Problema: API não responde
- **Verificação:** Teste as URLs diretas da API no navegador
- **Logs:** Verifique os logs nos terminais abertos

## 📊 Pontos de Observação

Durante o teste, observe:
1. **Latência da migração:** Tempo necessário para trocar versões
2. **State do Inspector:** Como o Inspector se comporta durante a troca
3. **Diferenças funcionais:** Tools disponíveis em cada versão
4. **Logs de erro:** Qualquer problema durante a transição

## 🎉 Resultado Final

Ao final do teste, você terá demonstrado:
- ✅ Migração bem-sucedida entre versões de API
- ✅ Funcionalidade MCP consistente
- ✅ Processo de upgrade controlado
- ✅ Compatibilidade com MCP Inspector