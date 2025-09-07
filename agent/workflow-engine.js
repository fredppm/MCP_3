import { EventEmitter } from 'events';

export class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.activeWorkflows = new Map();
  }

  // Define a workflow with steps
  defineWorkflow(name, steps) {
    this.workflows.set(name, {
      name,
      steps,
      createdAt: new Date()
    });
  }

  // Execute a workflow
  async executeWorkflow(workflowName, context = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    const executionId = `${workflowName}_${Date.now()}`;
    const execution = {
      id: executionId,
      workflowName,
      context,
      currentStep: 0,
      status: 'running',
      startTime: new Date(),
      stepResults: []
    };

    this.activeWorkflows.set(executionId, execution);
    this.emit('workflowStarted', execution);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        execution.currentStep = i;
        const step = workflow.steps[i];
        
        this.emit('stepStarted', { execution, step, stepIndex: i });
        
        const stepStartTime = Date.now();
        const result = await this.executeStep(step, execution.context);
        const stepDuration = Date.now() - stepStartTime;
        
        execution.stepResults.push({
          stepIndex: i,
          stepName: step.name,
          result,
          duration: stepDuration,
          timestamp: new Date()
        });

        // Update context with step result
        if (result && typeof result === 'object') {
          execution.context = { ...execution.context, ...result };
        }

        this.emit('stepCompleted', { execution, step, result, stepIndex: i });
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.totalDuration = execution.endTime - execution.startTime;

      this.emit('workflowCompleted', execution);
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date();

      this.emit('workflowFailed', { execution, error });
      throw error;
    } finally {
      this.activeWorkflows.delete(executionId);
    }
  }

  async executeStep(step, context) {
    if (typeof step.action === 'function') {
      return await step.action(context);
    } else if (typeof step.action === 'string') {
      // Handle predefined actions
      return await this.executePredefinedAction(step.action, step.params, context);
    } else {
      throw new Error(`Invalid step action: ${step.action}`);
    }
  }

  async executePredefinedAction(actionName, params, context) {
    switch (actionName) {
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, params.ms || 1000));
        return { delayed: params.ms || 1000 };
      
      case 'log':
        console.log(params.message || 'Workflow step executed');
        return { logged: params.message || 'Workflow step executed' };
      
      case 'transform':
        // Simple data transformation
        return params.transform ? params.transform(context) : context;
      
      default:
        throw new Error(`Unknown predefined action: ${actionName}`);
    }
  }

  // Get workflow status
  getWorkflowStatus(executionId) {
    return this.activeWorkflows.get(executionId);
  }

  // List all defined workflows
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  // List active workflow executions
  listActiveExecutions() {
    return Array.from(this.activeWorkflows.values());
  }
}

// Predefined workflow for mathematical operations
export class MathWorkflowEngine extends WorkflowEngine {
  constructor(multiAgentSystem) {
    super();
    this.agents = multiAgentSystem;
    this.defineMathWorkflows();
  }

  defineMathWorkflows() {
    // Mathematical processing workflow
    this.defineWorkflow('mathOperation', [
      {
        name: 'analyze_request',
        action: async (context) => {
          const analysis = await this.agents.agents.coordinator.analyze(context.userMessage);
          return { analysis };
        }
      },
      {
        name: 'math_analysis',
        action: async (context) => {
          if (context.analysis.requiresMath) {
            const mathAnalysis = await this.agents.agents.mathAnalyst.analyze(context.userMessage);
            return { mathAnalysis };
          }
          return { mathAnalysis: null };
        }
      },
      {
        name: 'execute_calculation',
        action: async (context) => {
          if (context.mathAnalysis) {
            const execution = await this.agents.agents.mcpExecutor.execute(context.mathAnalysis);
            return { execution };
          }
          return { execution: null };
        }
      },
      {
        name: 'present_result',
        action: async (context) => {
          if (context.execution) {
            const presentation = await this.agents.agents.presenter.present(context.execution, context.userMessage);
            return { finalResponse: presentation.response };
          } else {
            // Handle non-math requests
            const response = await this.agents.agents.coordinator.chat(context.userMessage);
            return { finalResponse: response };
          }
        }
      }
    ]);

    // Parallel processing workflow (for comparison)
    this.defineWorkflow('parallelMathOperation', [
      {
        name: 'parallel_analysis',
        action: async (context) => {
          const [coordinatorAnalysis, mathAnalysis] = await Promise.all([
            this.agents.agents.coordinator.analyze(context.userMessage),
            this.agents.agents.mathAnalyst.analyze(context.userMessage)
          ]);
          
          return { 
            coordinatorAnalysis, 
            mathAnalysis,
            processingType: 'parallel'
          };
        }
      },
      {
        name: 'execute_best_path',
        action: async (context) => {
          if (context.coordinatorAnalysis.requiresMath && context.mathAnalysis.mcpVersion !== 'unsupported') {
            const execution = await this.agents.agents.mcpExecutor.execute(context.mathAnalysis);
            const presentation = await this.agents.agents.presenter.present(execution, context.userMessage);
            return { finalResponse: presentation.response };
          } else {
            const response = await this.agents.agents.coordinator.chat(context.userMessage);
            return { finalResponse: response };
          }
        }
      }
    ]);
  }

  async processMathRequest(userMessage, workflowType = 'mathOperation') {
    const context = { userMessage };
    
    return await this.executeWorkflow(workflowType, context);
  }
}