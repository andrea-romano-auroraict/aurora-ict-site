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
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[ask-aurora] Missing OPENAI_API_KEY.");
      return new Response(JSON.stringify({ error: "Service is not configured." }), { status: 500 });
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
        model: OPENAI_MODEL,
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
