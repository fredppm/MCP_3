import { ChatBedrockConverse } from "@langchain/aws";

export function createLLM() {
  const model = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-20250514-v1:0";
  const region = process.env.BEDROCK_AWS_REGION || process.env.AWS_REGION || "us-east-1";
  const temperature = Number(process.env.BEDROCK_TEMPERATURE ?? 0);

  // Credenciais são resolvidas pela AWS SDK default provider chain (env, profile, etc.)
  return new ChatBedrockConverse({ model, region, temperature });
}