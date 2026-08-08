import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { buildSystemPrompt, buildProjectContext } from "@/lib/ai/system-prompt";

export async function POST(req: Request) {
  try {
    const {
      messages,
      provider,
      modelId,
      mode,
      isAutomationMode,
      activeWorkflow,
      apiKeys,
      files,
      activeFilePath,
      projectName,
    } = await req.json();

    const projectContext = buildProjectContext(files || [], activeFilePath, projectName);
    const systemPrompt = buildSystemPrompt(
      projectContext,
      mode || "plan",
      !!isAutomationMode,
      activeWorkflow
    );

    let model;

    if (provider === "google") {
      const apiKey = apiKeys?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Google Gemini API key required. Please set it in Settings." }),
          { status: 400 }
        );
      }
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      model = google(modelId || "gemini-2.0-flash");
    } else {
      const apiKey = apiKeys?.groq || process.env.GROQ_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Groq API key required. Please set it in Settings." }),
          { status: 400 }
        );
      }
      process.env.GROQ_API_KEY = apiKey;
      model = groq(modelId || "llama-3.3-70b-versatile");
    }

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Chat Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process AI chat request" }),
      { status: 500 }
    );
  }
}
