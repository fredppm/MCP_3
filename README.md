# MCP Server Evolution Testing

## TLDR

This project tests the behavior of MCP (Model Context Protocol) server evolution scenarios. We created a simple evolution from v1.0 (sum of 2 numbers) to v1.1 (sum of 3 numbers) to analyze how agents handle API contract changes. Key findings: agents don't automatically detect MCP contract changes during runtime, requiring restarts for proper adaptation. Hot-swapping between versions can lead to incorrect results due to parameter mismatches.

## Objective

The main objective was to test the behavior of MCP server evolution in a controlled environment. The scenario was designed to simulate a simple API evolution by adding functionality only - specifically evolving from a 2-number adder to a 3-number adder.

## Architecture

### Components
- **REST API v1.0**: Sums 2 numbers (a + b) on port 4000
- **REST API v1.1**: Sums 3 numbers (a + b + c) on port 4000  
- **MCP Server v1.0**: Exposes `sum` tool with parameters `a`, `b` (connects to REST v1.0)
- **MCP Server v1.1**: Exposes `sum` tool with parameters `a`, `b`, `c` (connects to REST v1.1)
- **Agent**: LangGraph-based agent using AWS Bedrock LLM with MCP tool integration

### Key Differences Between Versions

**v1.0 MCP Server:**
```javascript
parameters: z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number')
})
```

**v1.1 MCP Server:**
```javascript
parameters: z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
  c: z.number().describe('Third number')
    .default(0) // optional
})
```

## Test Scenarios and Results

### Execution 1: v1.0 Basic Operation
**Setup:** v1.0 REST + MCP running, agent connected
**Command:** `1+1`
**Result:** ✅ Single MCP call, result = 2
**Behavior:** Expected behavior, direct tool usage

*[Space for screenshot]*

### Execution 2: v1.0 with 3-Number Request
**Setup:** v1.0 REST + MCP running, agent connected
**Command:** `1+1+1`
**Expected Result:** 3
**Actual Result:** ✅ Two chained MCP calls to achieve result = 3
**Behavior:** Agent intelligently chained two 2-parameter calls: (1+1) + 1 = 3

*[Space for screenshot]*

### Execution 3: v1.1 with 2-Number Request (Initial Failure)
**Setup:** v1.1 REST + MCP running, NEW agent instance
**Command:** `1+1`
**Initial Result:** ❌ Tool call rejection (MCP v1.1 requires a, b, c parameters)
**Resolution:** Made parameter `c` optional with default value 0
**Final Result:** ✅ Success after retry
**Behavior:** Contract mismatch initially prevented execution

*[Space for screenshot]*

### Execution 3.1: v1.1 with --no-default-c Flag (Breaking Changes)
**Setup:** v1.1 REST + MCP running with `--no-default-c` flag, NEW agent instance
**Command:** `1+1`
**Result:** ❌ Tool call rejection (MCP v1.1 requires a, b, c parameters)
**Behavior:** Demonstrates proper MCP evolution without breaking changes
**Key Learning:** Using the `--no-default-c` flag ensures backward compatibility by requiring all parameters explicitly, preventing silent failures and maintaining contract integrity during API evolution.

*[Space for screenshot]*

### Execution 4: v1.1 with 3-Number Request
**Setup:** v1.1 REST + MCP running, agent connected
**Command:** `1+1+1`
**Result:** ✅ Single MCP call, result = 3
**Behavior:** Optimal behavior, direct tool usage with all parameters

*[Space for screenshot]*

### Execution 5: Hot-Swap During Runtime (v1.0 → v1.1)
**Setup:** Started with v1.0 REST + MCP, agent active and tested `1+1+1=3` (2 calls)
**Action:** Stopped v1.0 services, started v1.1 services (agent remained active)
**Command:** Same `1+1+1` request
**Result:** ❌ Still used 2 MCP calls instead of optimizing to 1 call
**Behavior:** Agent did not detect MCP contract change, maintained old calling pattern

*[Space for screenshot]*

### Execution 6: Agent Restart During Version Change
**Setup:** Agent restarted between v1.0 and v1.1 testing
**Result:** ✅ Agent adapted correctly
**v1.0 behavior:** 2 calls for `1+1+1`
**v1.1 behavior:** 1 call for `1+1+1`
**Behavior:** Fresh agent instance properly detected new MCP capabilities

*[Space for screenshot]*

### Execution 7: Rollback Scenario (v1.1 → v1.0)
**Setup:** v1.1 REST + MCP running, agent connected and tested `1+1+1=3`
**Action:** Agent kept running, rolled back to v1.0 REST + MCP
**Command:** Same `1+1+1` request
**Result:** ❌ **CRITICAL**: Result = 2 instead of 3!
**Behavior:** Agent attempted to use 3-parameter call on 2-parameter API, parameter `c` was ignored

*[Space for screenshot]*

## Key Findings

### 1. Agent Adaptation Limitations
- **Runtime Detection**: Agents do not automatically detect MCP contract changes during runtime
- **Restart Required**: Agent restart is necessary for proper adaptation to new MCP capabilities
- **Memory Persistence**: Agents maintain calling patterns learned from initial MCP discovery

### 2. Backward Compatibility Issues
- **Parameter Mismatch**: Rolling back to older versions while agent expects newer contracts causes silent failures
- **Data Loss**: Extra parameters are silently ignored, leading to incorrect calculations
- **No Error Handling**: No automatic detection of contract downgrades

### 3. Forward Compatibility Strategies
- **Optional Parameters**: Making new parameters optional with defaults enables backward compatibility
- **Graceful Degradation**: Agents can adapt to expanded contracts if parameters are optional

### 4. Operational Implications
- **Deployment Strategy**: MCP server updates require coordinated agent restarts
- **Rollback Risks**: Rolling back MCP servers while agents are running can cause data corruption
- **Monitoring Need**: Runtime contract validation mechanisms are needed

## Recommendations

1. **Implement Contract Versioning**: Add explicit version checking in MCP protocol
2. **Agent Health Checks**: Periodic validation of tool contracts
3. **Graceful Degradation**: Design APIs with backward-compatible optional parameters
4. **Coordinated Deployments**: Restart agents when updating MCP servers
5. **Runtime Validation**: Add parameter validation and contract mismatch detection

## Technical Stack

- **Language**: TypeScript (ES2022)
- **MCP Framework**: FastMCP v3.15.2
- **Agent Framework**: LangGraph with AWS Bedrock
- **REST Framework**: Express.js with TypeScript
- **Schema Validation**: Zod
- **Transport**: HTTP Streaming
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Tool**: tsx for development

## Running the Tests

### Automated Execution Scenarios

```bash
# Run interactive scenario selector (all 8 execution scenarios)
npm run run-scenario
# Quick test for specific scenarios (1-8)
npm run quick-test 1    # v1.0 Basic Operation (1+1)
npm run quick-test 2    # v1.0 with 3-Number Request (1+1+1)
npm run quick-test 3    # v1.1 with 2-Number Request (1+1)
npm run quick-test 3.1  # v1.1 with --no-default-c Flag (Breaking Changes)
npm run quick-test 4    # v1.1 with 3-Number Request (1+1+1)
npm run quick-test 5    # Hot-Swap During Runtime (v1.0 → v1.1)
npm run quick-test 6    # Agent Restart During Version Change
npm run quick-test 7    # Rollback Scenario (v1.1 → v1.0) - Critical Bug
```

### TypeScript Development

```bash
# Install dependencies for all TypeScript projects
npm run install-deps

# Build all TypeScript projects
npm run build-all

# Development mode (with hot reload)
npm run dev-v1      # Start v1.0 in development mode
npm run dev-v1.1    # Start v1.1 in development mode

# Individual development servers
npm run dev-rest-v1    # v1.0 REST server only
npm run dev-mcp-v1     # v1.0 MCP server only
npm run dev-rest-v1.1  # v1.1 REST server only
npm run dev-mcp-v1.1   # v1.1 MCP server only
```

### Manual Testing

```bash
# Production mode (compiled JavaScript)
npm run start-v1     # Start v1.0 environment
npm run start-v1.1   # Start v1.1 environment

# Run agent with different versions
npm run praison-math-v1    # Agent + v1.0 services
npm run praison-math-v1.1  # Agent + v1.1 services

# Test individual versions
npm run test-v1
npm run test-v1.1

# Stop all running services
npm run stop-all
```

### Execution Scenarios Guide

The `npm run run-scenarios` command provides an interactive menu to run all 8 execution scenarios:

1. **Execution 1**: v1.0 Basic Operation (1+1)
2. **Execution 2**: v1.0 with 3-Number Request (1+1+1) 
3. **Execution 3**: v1.1 with 2-Number Request - Without Optional Parameters (1+1)
4. **Execution 3.1**: v1.1 with --no-default-c Flag (Breaking Changes)
5. **Execution 4**: v1.1 with 3-Number Request (1+1+1)
6. **Execution 5**: Hot-Swap During Runtime (v1.0 → v1.1)
7. **Execution 6**: Agent Restart During Version Change
8. **Execution 7**: Rollback Scenario (v1.1 → v1.0) - **Critical Bug Demo**

Each scenario automatically:
- Cleans up existing processes
- Starts the required services
- Provides step-by-step instructions
- Waits for manual agent interaction
- Manages service lifecycle

## Project Structure

```
MCP_3/
├── agent/                    # LangGraph agent with Bedrock integration
│   ├── src/
│   │   ├── agent.ts         # Agent creation logic
│   │   ├── bedrock.ts       # AWS Bedrock LLM setup
│   │   ├── cli.ts           # Interactive CLI interface
│   │   └── mcp.ts           # MCP client configuration
│   ├── package.json
│   └── tsconfig.json
├── v1.0/                    # Version 1.0 implementation (TypeScript)
│   ├── src/
│   │   ├── mcp/server.ts    # MCP server (2 parameters)
│   │   └── rest/server.ts   # REST API (2 parameters)
│   ├── dist/                # Compiled JavaScript output
│   ├── package.json
│   ├── tsconfig.json
│   ├── mcp/server.js.backup # Original JS files (backup)
│   └── rest/server.js.backup
├── v1.1/                    # Version 1.1 implementation (TypeScript)
│   ├── src/
│   │   ├── mcp/server.ts    # MCP server (3 parameters)
│   │   └── rest/server.ts   # REST API (3 parameters)
│   ├── dist/                # Compiled JavaScript output
│   ├── package.json
│   ├── tsconfig.json
│   ├── mcp/server.js.backup # Original JS files (backup)
│   └── rest/server.js.backup
├── scripts/                 # Test automation scripts
│   ├── execution-scenarios.js
│   ├── quick-test.js
│   ├── test-v1.js
│   ├── test-v1.1.js
│   └── migration-validation.js
└── package.json             # Main project configuration
```

This testing framework provides valuable insights into MCP server evolution patterns and highlights the importance of careful contract management in production environments.