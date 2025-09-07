import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export class BedrockClient {
  constructor(options = {}) {
    this.region = options.region || process.env.AWS_REGION || 'us-east-1';
    this.modelId = options.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    
    this.client = new BedrockRuntimeClient({
      region: this.region,
      credentials: fromNodeProviderChain()
    });
  }

  async invokeModel(prompt, options = {}) {
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.7;

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: body,
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        success: true,
        content: responseBody.content[0].text,
        usage: responseBody.usage,
        model: this.modelId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  async chat(messages, options = {}) {
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.7;

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: body,
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        success: true,
        content: responseBody.content[0].text,
        usage: responseBody.usage,
        model: this.modelId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}