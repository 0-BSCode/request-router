import { z } from "zod";
import { outgoingMessageSchema, taskSchema } from "./contracts";

async function acceptMock(request: Request, schema: z.ZodType, idField: string) {
  const key = process.env.MOCK_API_KEY?.trim();
  if (!key) return Response.json({ error: "Mock API is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${key}`) {
    return Response.json({ error: "Invalid sandbox credential." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!schema.safeParse(body).success) {
    return Response.json({ error: "Invalid mock API payload." }, { status: 400 });
  }
  // shortcut: simulated acceptance only, add durable storage before using real tasks or channels.
  return Response.json({ [idField]: crypto.randomUUID() }, { status: 201 });
}

export function createMockTask(request: Request) {
  return acceptMock(request, taskSchema, "taskId");
}
export function sendMockMessage(request: Request) {
  return acceptMock(request, outgoingMessageSchema, "deliveryId");
}
