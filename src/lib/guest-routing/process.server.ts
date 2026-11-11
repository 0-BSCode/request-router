import { z } from "zod";
import { getOwnerSession } from "#/lib/auth";
import {
  deliveryReceiptSchema,
  messageSchema,
  taskReceiptSchema,
  type Extraction,
  type ProcessingResult,
  type TaskAttempt,
} from "./contracts";
import { extractRequests } from "./extract.server";
import { routeRequests } from "./routing";
import { renderAcknowledgement } from "./templates";

async function postMock<T>(
  origin: string,
  path: string,
  body: unknown,
  key: string,
  receipt: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(new URL(path, origin), {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (response.status !== 201) throw new Error("Mock request failed.");
  return receipt.parse(await response.json());
}

export async function processMessage(request: Request): Promise<Response> {
  try {
    const session = await getOwnerSession(request.headers);
    if (!session) return Response.json({ error: "Sign in to process a message." }, { status: 401 });
    const origin = new URL(request.url).origin;
    // Do not send sandbox credentials to a client-controlled host or cross-origin caller.
    if (
      origin !== new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin ||
      (request.headers.has("origin") && request.headers.get("origin") !== origin)
    ) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const parsed = messageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json(
        { error: "Provide a valid ID, sender, channel, and message of 1 to 5000 characters." },
        { status: 400 },
      );
    const key = process.env.OPENROUTER_API_KEY?.trim();
    const model = process.env.OPENROUTER_MODEL?.trim();
    const mockKey = process.env.MOCK_API_KEY?.trim();
    if (!key || !model || !mockKey)
      return Response.json(
        {
          error:
            "Routing is not configured. Set the server OpenRouter key, model, and mock API key.",
        },
        { status: 503 },
      );
    const message = parsed.data;
    let extraction: Extraction | null = null;
    let extractionError: string | undefined;
    try {
      extraction = await extractRequests(message.text, { key, model });
    } catch {
      extractionError =
        "The message could not be classified. Sent for front-desk review if task creation succeeds.";
    }
    const tasks: TaskAttempt[] = [];
    for (const task of routeRequests(message, extraction)) {
      try {
        const { taskId } = await postMock(
          origin,
          "/api/mock/tasks",
          task,
          mockKey,
          taskReceiptSchema,
        );
        tasks.push({ task, status: "created", taskId });
      } catch {
        tasks.push({
          task,
          status: "failed",
          error: "The mock Tasks API could not record this request.",
        });
      }
    }
    const text = renderAcknowledgement(extraction?.language ?? "unknown", tasks);
    let acknowledgement: ProcessingResult["acknowledgement"];
    try {
      const { deliveryId } = await postMock(
        origin,
        "/api/mock/messages",
        { messageId: message.messageId, channel: message.channel, recipient: message.sender, text },
        mockKey,
        deliveryReceiptSchema,
      );
      acknowledgement = { text, status: "sent", deliveryId };
    } catch {
      acknowledgement = {
        text,
        status: "failed",
        error: "The mock Messaging API could not send this reply.",
      };
    }
    const result: ProcessingResult = {
      messageId: message.messageId,
      extractionStatus: !extraction
        ? "failed"
        : ["unsupported", "unknown"].includes(extraction.language) || !extraction.requests.length
          ? "review"
          : "extracted",
      ...(extractionError ? { extractionError } : {}),
      tasks,
      acknowledgement,
    };
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Processing is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
