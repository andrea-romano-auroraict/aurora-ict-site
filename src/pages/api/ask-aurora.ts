import type { APIRoute } from "astro";
import {
  MODE_INSTRUCTION,
  SYSTEM_PROMPT,
  mapServicesToCtaKeys,
  sanitizeHistory,
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

const getRuntimeEnv = (locals: unknown) => {
  const runtimeEnv =
    (locals as { runtime?: { env?: Record<string, string | undefined> } })?.runtime?.env ?? {};
  return runtimeEnv;
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = getRuntimeEnv(locals);
  const hasOpenAiKey = Boolean(runtimeEnv.OPENAI_API_KEY);
  const model = runtimeEnv.OPENAI_MODEL ?? "gpt-4.1-mini";
  const runtimeEnvSource = Object.keys(runtimeEnv).length > 0 ? "locals.runtime.env" : "unknown";

  return new Response(
    JSON.stringify({
      ok: true,
      route: "/api/ask-aurora",
      method: "GET",
      hasOpenAiKey,
      model,
      runtimeEnvSource
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtimeEnv = getRuntimeEnv(locals);
    const apiKey = runtimeEnv.OPENAI_API_KEY;
    const selectedModel = runtimeEnv.OPENAI_MODEL ?? "gpt-4.1-mini";

    console.info("[ask-aurora] Runtime config", {
      hasOpenAiKey: Boolean(apiKey),
      model: selectedModel
    });

    if (!apiKey) {
      console.error("[ask-aurora] Missing OPENAI_API_KEY.");
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const payload = (await request.json()) as Partial<AskAuroraRequestPayload>;
    const validationError = validateRequest(payload);

    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), { status: 400 });
    }

    const message = payload.message!.trim();
    const history = sanitizeHistory(payload.history);
    const funMode = payload.funMode!;

    const input = [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }]
      },
      {
        role: "system",
        content: [{ type: "input_text", text: MODE_INSTRUCTION(funMode) }]
      },
      ...history.map((entry) => ({
        role: entry.role,
        content: [{ type: "input_text", text: entry.text }]
      })),
      {
        role: "user",
        content: [{ type: "input_text", text: message }]
      }
    ];

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
    if (requestId) {
      console.info(`[ask-aurora] OpenAI request id: ${requestId}`);
    }

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("[ask-aurora] OpenAI call failed.", {
        status: openAiResponse.status,
        openAiStatusCode: openAiResponse.status,
        requestId,
        errorPreview: errorText.slice(0, 400)
      });
      return new Response(JSON.stringify({ error: "Failed to generate response." }), { status: 502 });
    }

    const responsePayload = await openAiResponse.json();
    const assistantMessage = readOutputText(responsePayload);

    if (!assistantMessage) {
      console.error("[ask-aurora] OpenAI returned empty output.", { requestId });
      return new Response(JSON.stringify({ error: "Empty response from AI service." }), { status: 502 });
    }

    const suggestedServices = suggestServices(message, assistantMessage);
    const ctaKeys = mapServicesToCtaKeys(suggestedServices);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        suggestedServices,
        ctaKeys,
        modeUsed: funMode ? "fun" : "serious"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("[ask-aurora] Unexpected server error.", error);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), { status: 500 });
  }
};
