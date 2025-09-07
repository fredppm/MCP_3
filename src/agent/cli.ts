import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createLLM } from "./bedrock.ts";
import { createMCPClient } from "./mcp.ts";
import { createAgent } from "./agent.ts";

async function executeCommand(command: string) {
  const mcp = createMCPClient();
  const tools = await mcp.getTools();
  const llm = createLLM();
  const agent = createAgent({ llm, tools });

  const messages: any[] = [{ role: "user", content: command }];

  console.log(`\nExecutando: ${command}\n`);

  try {
    const stream = await agent.stream({ messages }, { streamMode: "values" });
    let finalAssistant = "";
    
    for await (const chunk of stream) {
      const msgs = chunk.messages;
      const last = msgs?.[msgs.length - 1];
      
      // Verificar se é uma mensagem de AI (assistant)
      if (last && (last.constructor.name === 'AIMessage' || last._getType?.() === 'ai')) {
        const text = typeof last.content === "string"
          ? last.content
          : Array.isArray(last.content)
            ? last.content.map((b: any) => {
                if (typeof b === "string") return b;
                if (typeof b?.text === "string") return b.text;
                return "";
              }).join("")
            : String(last.content || "");
        
        const delta = text.slice(finalAssistant.length);
        if (delta) {
          process.stdout.write(delta);
        }
        finalAssistant = text;
      }
      
      // Também capturar mensagens de tool para mostrar resultados
      if (last && last.constructor.name === 'ToolMessage') {
        const toolResult = last.content;
        if (toolResult && typeof toolResult === 'string') {
          try {
            const parsed = JSON.parse(toolResult);
            if (parsed.result !== undefined) {
              const resultText = `\n\nResult: ${parsed.result}`;
              process.stdout.write(resultText);
              finalAssistant += resultText;
            }
          } catch {
            // Se não conseguir fazer parse, mostra o conteúdo bruto
            process.stdout.write(`\n\nTool result: ${toolResult}`);
            finalAssistant += `\n\nTool result: ${toolResult}`;
          }
        }
      }
    }
    process.stdout.write("\n");
  } catch (err) {
    console.error("\n[error]", (err as Error)?.message || err);
  } finally {
    try { await mcp.close(); } catch {}
  }
}

async function interactiveMode() {
  const mcp = createMCPClient();
  const tools = await mcp.getTools();
  const llm = createLLM();
  const agent = createAgent({ llm, tools });

  const rl = createInterface({ input, output });
  const messages: any[] = [];

  console.log("\nBedrock + MCP CLI — type your question. (/exit to quit)\n");

  const cleanup = async () => {
    try { await mcp.close(); } catch {}
    rl.close();
  };

  process.on("SIGINT", async () => {
    console.log("\nSaindo...");
    await cleanup();
    process.exit(0);
  });

  while (true) {
    const user = (await rl.question("> ")).trim();
    if (!user) continue;
    if (["/exit", "/quit", ":q", "exit"].includes(user.toLowerCase())) {
      await cleanup();
      break;
    }

    messages.push({ role: "user", content: user });

    let lastPrinted = "";
    let finalAssistant = "";

    try {
      const stream = await agent.stream({ messages }, { streamMode: "values" });
      for await (const chunk of stream) {
        const msgs = chunk.messages;
        const last = msgs?.[msgs.length - 1];
        
        // Verificar se é uma mensagem de AI (assistant)
        if (last && (last.constructor.name === 'AIMessage' || last._getType?.() === 'ai')) {
          const text = typeof last.content === "string"
            ? last.content
            : Array.isArray(last.content)
              ? last.content.map((b: any) => {
                  if (typeof b === "string") return b;
                  if (typeof b?.text === "string") return b.text;
                  return "";
                }).join("")
              : String(last.content || "");
          
          const delta = text.slice(lastPrinted.length);
          if (delta) {
            process.stdout.write(delta);
          }
          lastPrinted = text;
          finalAssistant = text;
        }
        
        // Também capturar mensagens de tool para mostrar resultados
        if (last && last.constructor.name === 'ToolMessage') {
          const toolResult = last.content;
          if (toolResult && typeof toolResult === 'string') {
            try {
              const parsed = JSON.parse(toolResult);
              if (parsed.result !== undefined) {
                const resultText = `\n\nResult: ${parsed.result}`;
                process.stdout.write(resultText);
                finalAssistant += resultText;
              }
            } catch {
              // Se não conseguir fazer parse, mostra o conteúdo bruto
              process.stdout.write(`\n\nTool result: ${toolResult}`);
              finalAssistant += `\n\nTool result: ${toolResult}`;
            }
          }
        }
      }
      process.stdout.write("\n");
      messages.push({ role: "assistant", content: finalAssistant });
    } catch (err) {
      console.error("\n[error]", (err as Error)?.message || err);
    }
  }
}

async function main() {
  // Verificar se há argumentos de linha de comando
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Modo de execução direta - junta todos os argumentos como um comando
    const command = args.join(" ");
    await executeCommand(command);
  } else {
    // Modo interativo original
    await interactiveMode();
  }
}

main().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});