import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";

export function createAgent({ llm, tools }: { llm: any; tools: any[] }) {
  // ReAct prebuilt já lida com tool calling e memória por mensagens
  return createReactAgent({ llm, tools });
}