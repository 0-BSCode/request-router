import { afterEach, expect, test, vi } from "vite-plus/test";
import { extractRequests } from "./extract.server";

export const towelItem = {
  type: "towels",
  details: "Two towels",
  sourceText: "two towels",
  room: "204",
  roomSourceText: "Room 204",
  roomStatus: "known",
};
export const towelExtraction = { language: "en", requests: [towelItem] };
export function completion(data: unknown = towelExtraction) {
  return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(data) } }] };
}
afterEach(() => vi.unstubAllGlobals());

test("sends configured model, structured schema, guest data, and bounded signal", async () => {
  const mock = vi.fn().mockResolvedValue(Response.json(completion()));
  vi.stubGlobal("fetch", mock);
  expect(
    await extractRequests("Room 204: two towels", { key: "test-secret", model: "test/model" }),
  ).toEqual(towelExtraction);
  const [url, init] = mock.mock.calls[0];
  expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
  const body = JSON.parse(init.body);
  expect(body.model).toBe("test/model");
  expect(body.provider.require_parameters).toBe(true);
  expect(body.response_format.json_schema.strict).toBe(true);
  expect(body.response_format.json_schema.schema.properties.requests).toBeTruthy();
  expect(body.messages[1]).toEqual({ role: "user", content: "Room 204: two towels" });
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

test.each([
  ["HTTP error", () => new Response("secret-provider-body", { status: 429 })],
  [
    "refusal",
    () =>
      Response.json({
        choices: [{ finish_reason: "stop", message: { content: "{}", refusal: "no" } }],
      }),
  ],
  [
    "truncation",
    () =>
      Response.json({
        choices: [
          { finish_reason: "length", message: { content: JSON.stringify(towelExtraction) } },
        ],
      }),
  ],
  ["missing content", () => Response.json({ choices: [] })],
  [
    "bad JSON",
    () => Response.json({ choices: [{ finish_reason: "stop", message: { content: "{" } }] }),
  ],
  [
    "bad shape",
    () =>
      Response.json(
        completion({ language: "en", requests: [{ ...towelItem, department: "concierge" }] }),
      ),
  ],
  [
    "fabricated request evidence",
    () =>
      Response.json(
        completion({ ...towelExtraction, requests: [{ ...towelItem, sourceText: "not present" }] }),
      ),
  ],
  [
    "fabricated room evidence",
    () =>
      Response.json(
        completion({
          ...towelExtraction,
          requests: [{ ...towelItem, roomSourceText: "Room 999" }],
        }),
      ),
  ],
  [
    "room substring",
    () =>
      Response.json(completion({ ...towelExtraction, requests: [{ ...towelItem, room: "04" }] })),
  ],
] as const)("rejects %s", async (_, response) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
  await expect(
    extractRequests("Room 204: two towels", { key: "secret", model: "test" }),
  ).rejects.toThrow();
});

test("propagates timeout for orchestration to review", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("deadline", "TimeoutError")));
  await expect(
    extractRequests("Room 204: two towels", { key: "secret", model: "test" }),
  ).rejects.toThrow();
});
