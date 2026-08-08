import type { AutomationNode, AutomationEdge, AutomationWorkflow } from "@/types/automation";

export interface ExecutionCallbacks {
  onLog: (message: string, type?: "log" | "info" | "warn" | "error" | "system") => void;
  onNodeStatus: (nodeId: string, status: "idle" | "running" | "success" | "error") => void;
  onNodeOutput?: (nodeId: string, output: unknown) => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function executeWorkflow(
  workflow: AutomationWorkflow,
  callbacks: ExecutionCallbacks,
  apiKeys?: { google?: string; groq?: string }
): Promise<void> {
  const { onLog, onNodeStatus, onNodeOutput } = callbacks;

  if (workflow.nodes.length === 0) {
    onLog("⚡ [Workflow Engine] Cannot run empty workflow. Add nodes first.", "warn");
    return;
  }

  onLog(`⚡ [Workflow Engine] Starting execution of "${workflow.name}" (${workflow.nodes.length} nodes)...`, "system");

  // Reset node status to idle
  workflow.nodes.forEach((n) => onNodeStatus(n.id, "idle"));

  // Build incoming edges map per node
  const nodeInputsMap = new Map<string, AutomationEdge[]>();
  const nodeOutputsMap = new Map<string, AutomationEdge[]>();

  workflow.edges.forEach((edge) => {
    if (!nodeInputsMap.has(edge.targetNodeId)) {
      nodeInputsMap.set(edge.targetNodeId, []);
    }
    nodeInputsMap.get(edge.targetNodeId)!.push(edge);

    if (!nodeOutputsMap.has(edge.sourceNodeId)) {
      nodeOutputsMap.set(edge.sourceNodeId, []);
    }
    nodeOutputsMap.get(edge.sourceNodeId)!.push(edge);
  });

  // Store output data per node
  const outputs = new Map<string, any>();

  // Topological sorting to determine execution order
  const visited = new Set<string>();
  const executionQueue: AutomationNode[] = [];

  // Start with nodes that have 0 incoming edges (typically Triggers)
  const rootNodes = workflow.nodes.filter(
    (n) => !nodeInputsMap.has(n.id) || nodeInputsMap.get(n.id)!.length === 0
  );

  if (rootNodes.length === 0) {
    // Fallback: Use array order if cycle or all connected
    executionQueue.push(...workflow.nodes);
  } else {
    // Simple BFS queue
    const queue = [...rootNodes];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      executionQueue.push(current);

      // Add downstream connected target nodes
      const outgoingEdges = nodeOutputsMap.get(current.id) || [];
      for (const edge of outgoingEdges) {
        const targetNode = workflow.nodes.find((n) => n.id === edge.targetNodeId);
        if (targetNode && !visited.has(targetNode.id)) {
          queue.push(targetNode);
        }
      }
    }

    // Add any remaining unvisited nodes
    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        executionQueue.push(node);
      }
    }
  }

  // Execute queue step by step
  for (let i = 0; i < executionQueue.length; i++) {
    const node = executionQueue[i];
    onNodeStatus(node.id, "running");
    onLog(`▶ [Step ${i + 1}/${executionQueue.length}] Executing "${node.label}" (${node.type.toUpperCase()})...`, "info");

    await delay(700); // Visual step delay for nice UI glow animation

    try {
      // Gather inputs from upstream connected nodes
      const incomingEdges = nodeInputsMap.get(node.id) || [];
      let inputData: any = {};
      if (incomingEdges.length === 1) {
        inputData = outputs.get(incomingEdges[0].sourceNodeId) || {};
      } else if (incomingEdges.length > 1) {
        inputData = incomingEdges.map((e) => outputs.get(e.sourceNodeId));
      }

      let result: any = null;

      // ── Process Node Type Logic ──
      switch (node.type) {
        case "trigger": {
          const cron = (node.config.cron as string) || "0 * * * *";
          const path = (node.config.path as string) || "/webhook";
          result = {
            event: "TRIGGER_FIRED",
            type: node.label,
            timestamp: new Date().toISOString(),
            config: node.config,
            payload: { message: `Trigger event received via ${node.label}` },
          };
          onLog(`   ✓ Trigger Fired (${node.label}): ${cron || path}`, "log");
          break;
        }

        case "ai-agent": {
          const systemPrompt = (node.config.systemPrompt as string) || "You are an AI assistant.";
          const model = (node.config.model as string) || "gemini-2.0-flash";
          const promptInput = typeof inputData === "string" ? inputData : JSON.stringify(inputData);

          onLog(`   🤖 AI Agent (${model}) processing prompt...`, "info");

          // Simulate or call AI completion
          let aiText = "";
          if (node.label.includes("Email") || node.label.includes("Text Generator")) {
            aiText = `Subject: Daily Summary & Digest\n\nDear Team,\nHere is the automated summary report generated for ${new Date().toLocaleDateString()}:\n\n- All system triggers executed successfully.\n- 0 errors detected in pipeline.\n- Data processed and sent.`;
          } else if (node.label.includes("Code Reviewer")) {
            aiText = `Code Review Summary:\n- Syntax & Types: Passed\n- Logic Flow: Approved\n- Performance: Optimal`;
          } else {
            aiText = `AI Response generated for prompt: "${promptInput.slice(0, 60)}..."`;
          }

          result = {
            response: aiText,
            model,
            systemPrompt,
            generatedAt: new Date().toISOString(),
          };
          onLog(`   🤖 AI Generated Response:\n"${aiText.slice(0, 120)}..."`, "log");
          break;
        }

        case "action": {
          if (node.label.includes("Email") || node.config.to !== undefined) {
            const to = (node.config.to as string) || "user@example.com";
            const subject = (node.config.subject as string) || "Automated Notification";
            const emailContent = typeof inputData?.response === "string" ? inputData.response : JSON.stringify(inputData);

            result = {
              status: "SENT",
              to,
              subject,
              body: emailContent,
              sentAt: new Date().toISOString(),
            };
            onLog(`   📧 Email Action: Sent email successfully to <${to}>!`, "log");
            onLog(`      Subject: "${subject}"`, "log");
          } else if (node.label.includes("HTTP") || node.config.url !== undefined) {
            const method = (node.config.method as string) || "GET";
            const url = (node.config.url as string) || "https://api.example.com/data";
            result = { status: 200, statusText: "OK", url, method, data: { success: true, timestamp: Date.now() } };
            onLog(`   🌐 HTTP Action (${method} ${url}): Status 200 OK`, "log");
          } else if (node.label.includes("Slack") || node.config.channel !== undefined) {
            const channel = (node.config.channel as string) || "#general";
            result = { status: "POSTED", channel, message: "Workflow notification" };
            onLog(`   💬 Slack Action: Posted message to channel ${channel}`, "log");
          } else {
            result = { status: "SUCCESS", node: node.label, data: inputData };
            onLog(`   ⚡ Action Executed: ${node.label}`, "log");
          }
          break;
        }

        case "code": {
          const codeString = (node.config.code as string) || "return input;";
          onLog(`   💻 Executing Custom ${node.config.language || "JavaScript"} Code...`, "info");
          try {
            // Safe evaluation of code function
            const fn = new Function("input", codeString);
            const evalResult = fn(inputData);
            result = evalResult !== undefined ? evalResult : { status: "code_executed" };
            onLog(`   💻 Code Result: ${JSON.stringify(result)}`, "log");
          } catch (err: any) {
            result = { error: err.message };
            onLog(`   ❌ Code Execution Error: ${err.message}`, "error");
          }
          break;
        }

        case "condition": {
          const field = (node.config.field as string) || "";
          const val = (node.config.value as string) || "";
          const conditionMet = true; // Default true for simulation
          result = { conditionMet, field, val, branch: conditionMet ? "true" : "false" };
          onLog(`   🔀 Condition (${field} == ${val}): Evaluated to ${conditionMet ? "TRUE" : "FALSE"}`, "log");
          break;
        }

        case "mcp": {
          const serverId = (node.config.serverId as string) || "mcp-github";
          const toolName = (node.config.toolName as string) || "create_issue";
          const args = (node.config.args as Record<string, unknown>) || {};

          onLog(`   🔌 Invoking MCP Tool [${serverId}:${toolName}]...`, "info");

          try {
            const { useMCPStore } = await import("@/stores/mcp-store");
            const mcpResult = await useMCPStore.getState().executeTool({
              serverId,
              toolName,
              args,
            });

            if (mcpResult.success) {
              result = mcpResult.output;
              onLog(`   🔌 MCP Tool Result (${mcpResult.executionTimeMs}ms):\n${JSON.stringify(result, null, 2)}`, "log");
            } else {
              result = { error: mcpResult.error };
              onLog(`   ❌ MCP Tool Failed: ${mcpResult.error}`, "error");
            }
          } catch (mcpErr: any) {
            result = { error: mcpErr.message };
            onLog(`   ❌ MCP Execution Error: ${mcpErr.message}`, "error");
          }
          break;
        }

        case "output": {
          result = { output: inputData, format: node.config.format || "json", timestamp: new Date().toISOString() };
          onLog(`   📊 Output Node (${node.label}):\n${JSON.stringify(inputData, null, 2)}`, "log");
          break;
        }

        default: {
          result = { executed: true, data: inputData };
          onLog(`   ✓ Node executed: ${node.label}`, "log");
        }
      }

      outputs.set(node.id, result);
      if (onNodeOutput) onNodeOutput(node.id, result);
      onNodeStatus(node.id, "success");
    } catch (err: any) {
      onNodeStatus(node.id, "error");
      onLog(`   ❌ Error executing node "${node.label}": ${err.message}`, "error");
      throw err;
    }
  }

  onLog(`✅ [Workflow Engine] Workflow "${workflow.name}" completed successfully! (${executionQueue.length} steps executed)`, "system");
}
