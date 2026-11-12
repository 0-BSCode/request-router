import { afterEach, expect, test, vi } from "vite-plus/test";
import { createMockTask, sendMockMessage } from "./mocks.server";

afterEach(() => vi.unstubAllEnvs());
const task = {
  messageId: "test",
  channel: "email",
  sender: "guest@example.test",
  type: "towels",
  details: "Two towels",
  sourceText: "Two towels",
  originalMessage: "Room 204: Two towels",
  detectedLanguage: "en",
  room: "204",
  department: "housekeeping",
  needsReview: false,
  reviewReason: null,
};
const message = {
  messageId: "test",
  channel: "email",
  recipient: "guest@example.test",
  text: "Request recorded.",
};

test.each([
  [createMockTask, task, "taskId"],
  [sendMockMessage, message, "deliveryId"],
] as const)("mock validates credentials and payloads", async (handler, payload, id) => {
  vi.stubEnv("MOCK_API_KEY", "sandbox-test");
  const request = (body: unknown, key = "sandbox-test") =>
    new Request("http://localhost/api/mock", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const accepted = await handler(request(payload));
  expect(accepted.status).toBe(201);
  expect((await accepted.json())[id]).toMatch(/^[a-f0-9-]{36}$/);
  expect((await handler(request(payload, "wrong"))).status).toBe(401);
  expect((await handler(request({}))).status).toBe(400);
  expect(
    (
      await handler(
        new Request("http://localhost", {
          method: "POST",
          headers: { authorization: "Bearer sandbox-test" },
          body: "{",
        }),
      )
    ).status,
  ).toBe(400);
  vi.stubEnv("MOCK_API_KEY", "");
  expect((await handler(request(payload))).status).toBe(503);
});

test("task API requires validated detected-language metadata", async () => {
  vi.stubEnv("MOCK_API_KEY", "sandbox-test");
  for (const detectedLanguage of [undefined, "unsupported", "French"]) {
    const response = await createMockTask(
      new Request("http://localhost/api/mock/tasks", {
        method: "POST",
        headers: { authorization: "Bearer sandbox-test", "content-type": "application/json" },
        body: JSON.stringify({ ...task, detectedLanguage }),
      }),
    );
    expect(response.status).toBe(400);
  }
});
