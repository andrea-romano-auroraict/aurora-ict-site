import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  MODE_INSTRUCTION,
  SYSTEM_PROMPT,
  boundUserMessage,
  buildGuardrailInstruction,
  detectPromptInjection,
  detectRestrictedTopics,
  mapServicesToCtaKeys,
  sanitizeHistory,
  shapeAssistantMessage,
  suggestServices,
  type AskAuroraRequestPayload
} from "../../lib/ask-aurora";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

const readOutputText = (responsePayload: any): string => {
  if (typeof responsePayload?.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const outputItems = Array.isArray(responsePayload?.output) ? responsePayload.output : [];
  for (const item of outputItems) {
    const contents = Array.isArray(item?.content) ? item.content : [];
    for (const content of contents) {
      if (typeof content?.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
};

const validateRequest = (payload: Partial<AskAuroraRequestPayload>) => {
  if (!payload || typeof payload !== "object") {
    return "Invalid request payload.";
  }
  if (typeof payload.message !== "string" || payload.message.trim().length === 0) {
    return "Message is required.";
  }
  if (typeof payload.funMode !== "boolean") {
    return "funMode must be a boolean.";
  }
  return null;
};

export const GET: APIRoute = async () => {
  const hasOpenAiKey = Boolean(env.OPENAI_API_KEY);
  const model = env.OPENAI_MODEL ?? "gpt-4.1-mini";

  return new Response(
    JSON.stringify({
      ok: true,
      route: "/api/ask-aurora",
      method: "GET",
      hasOpenAiKey,
      model,
      runtimeEnvSource: "cloudflare:workers"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.info("[ask-aurora] POST start");

    const apiKey = env.OPENAI_API_KEY;
    const selectedModel = env.OPENAI_MODEL ?? "gpt-4.1-mini";

    console.info("[ask-aurora] Runtime config", {
      hasOpenAiKey: Boolean(apiKey),
      model: selectedModel
    });

    if (!apiKey) {
      console.error("[ask-aurora] Missing OPENAI_API_KEY.");
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const payload = (await request.json()) as Partial<AskAuroraRequestPayload>;
    console.info("[ask-aurora] request.json() parsed");
    const validationError = validateRequest(payload);

    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), { status: 400 });
    }

    const message = boundUserMessage(payload.message!);
    const history = sanitizeHistory(payload.history);
    const funMode = payload.funMode!;
    const restrictedCategories = detectRestrictedTopics(message);
    const promptInjectionDetected = detectPromptInjection(message, history);
    const guardrailInstruction = buildGuardrailInstruction({
      mode: funMode ? "fun" : "serious",
      restrictedCategories,
      promptInjectionDetected
    });
    const historyRoleCounts = history.reduce(
      (acc, entry) => {
        if (entry.role === "assistant") {
          acc.assistant += 1;
        } else if (entry.role === "user") {
          acc.user += 1;
        }
        return acc;
      },
      { assistant: 0, user: 0 }
    );
    console.info("[ask-aurora] payload summary", {
      messageLength: message.length,
      historyCount: history.length,
      historyChars: history.reduce((acc, item) => acc + item.text.length, 0),
      mode: funMode ? "fun" : "serious"
    });
    if (restrictedCategories.length > 0) {
      console.warn("[ask-aurora] restricted topic detected", { categories: restrictedCategories });
    }
    if (promptInjectionDetected) {
      console.warn("[ask-aurora] prompt injection attempt detected");
    }

    const input = [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }]
      },
      {
        role: "system",
        content: [{ type: "input_text", text: MODE_INSTRUCTION(funMode) }]
      },
      ...(guardrailInstruction
        ? [
            {
              role: "system" as const,
              content: [{ type: "input_text" as const, text: guardrailInstruction }]
            }
          ]
        : []),
      ...history.map((entry) =>
        entry.role === "assistant"
          ? {
              role: entry.role,
              content: [{ type: "output_text", text: entry.text }]
            }
          : {
              role: entry.role,
              content: [{ type: "input_text", text: entry.text }]
            }
      ),
      {
        role: "user",
        content: [{ type: "input_text", text: message }]
      }
    ];

    console.info("[ask-aurora] calling OpenAI Responses API", {
      model: selectedModel,
      inputMessages: input.length,
      historyRoles: historyRoleCounts
    });
    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        input,
        max_output_tokens: 420
      })
    });

    const requestId = openAiResponse.headers.get("x-request-id");
    const responseContentType = openAiResponse.headers.get("content-type");
    console.info("[ask-aurora] OpenAI response received", {
      status: openAiResponse.status,
      contentType: responseContentType,
      requestId
    });
    if (requestId) {
      console.info(`[ask-aurora] OpenAI request id: ${requestId}`);
    }

    const openAiRawBody = await openAiResponse.text();

    if (!openAiResponse.ok) {
      console.error("[ask-aurora] OpenAI call failed.", {
        status: openAiResponse.status,
        openAiStatusCode: openAiResponse.status,
        requestId,
        errorPreview: openAiRawBody.slice(0, 400)
      });
      console.warn("[ask-aurora] model response failed", {
        requestId,
        restrictedTopicDetected: restrictedCategories.length > 0,
        promptInjectionDetected
      });
      return new Response(JSON.stringify({ error: "Failed to generate response." }), { status: 502 });
    }

    let responsePayload: any;
    try {
      responsePayload = JSON.parse(openAiRawBody);
      console.info("[ask-aurora] OpenAI JSON parse succeeded");
    } catch (parseError) {
      console.error("[ask-aurora] OpenAI JSON parse failed.", {
        requestId,
        contentType: responseContentType,
        bodyPreview: openAiRawBody.slice(0, 400),
        parseErrorMessage: parseError instanceof Error ? parseError.message : String(parseError)
      });
      console.warn("[ask-aurora] model response failed", {
        requestId,
        restrictedTopicDetected: restrictedCategories.length > 0,
        promptInjectionDetected
      });
      return new Response(JSON.stringify({ error: "Invalid JSON response from AI service." }), {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const rawAssistantMessage = readOutputText(responsePayload);
    const { message: assistantMessage, fallbackUsed } = shapeAssistantMessage(rawAssistantMessage, funMode);
    if (fallbackUsed) {
      console.warn("[ask-aurora] response shaping fallback used", { requestId });
    }

    const suggestedServices = suggestServices(message, assistantMessage);
    const ctaKeys = mapServicesToCtaKeys(suggestedServices);
    console.info("[ask-aurora] model response succeeded", {
      requestId,
      restrictedTopicDetected: restrictedCategories.length > 0,
      promptInjectionDetected,
      suggestedServicesCount: suggestedServices.length,
      ctaCount: ctaKeys.length
    });

    return new Response(
      JSON.stringify({
        message: assistantMessage ?? "",
        suggestedServices: Array.isArray(suggestedServices) ? suggestedServices : [],
        ctaKeys: Array.isArray(ctaKeys) ? Array.from(new Set(ctaKeys)) : [],
        modeUsed: funMode ? "fun" : "serious",
        restrictedTopicDetected: restrictedCategories.length > 0,
        injectionDetected: promptInjectionDetected
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("[ask-aurora] Unexpected server error.", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
