import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";

export function createAgent({ llm, tools }: { llm: any; tools: any[] }) {
  // Linha 5:
  // ReAct prebuilt already handles tool calling and memory through messages
  return createReactAgent({ llm, tools });
}