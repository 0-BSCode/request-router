import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { MockApiReference } from "#/components/MockApiReference";
import { formatExample, mockApiExamples } from "./api-examples";
import {
  deliveryReceiptSchema,
  outgoingMessageSchema,
  taskReceiptSchema,
  taskSchema,
} from "./contracts";

const [tasks, messages] = mockApiExamples;

test("API reference examples satisfy the shared mock contracts", () => {
  expect(tasks.path).toBe("/api/mock/tasks");
  expect(taskSchema.parse(tasks.request)).toEqual(tasks.request);
  expect(tasks.request.detectedLanguage).toBe("en");
  expect(taskReceiptSchema.parse(tasks.response)).toEqual(tasks.response);
  expect(messages.path).toBe("/api/mock/messages");
  expect(outgoingMessageSchema.parse(messages.request)).toEqual(messages.request);
  expect(deliveryReceiptSchema.parse(messages.response)).toEqual(messages.response);
});

test("each endpoint starts collapsed behind an expandable heading button", () => {
  const html = renderToStaticMarkup(createElement(MockApiReference));
  expect(html.match(/<h2[^>]*><button[^>]*aria-expanded="false"/g)).toHaveLength(2);
  const regions = html.match(/<div[^>]*role="region"[^>]*>/g) ?? [];
  expect(regions).toHaveLength(2);
  for (const region of regions) expect(region).toContain('hidden=""');
});

test("the reference renders exactly those examples with placeholder auth and error statuses", () => {
  const text = renderToStaticMarkup(createElement(MockApiReference))
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
  for (const example of mockApiExamples) {
    expect(text).toContain(`POST ${example.path}`);
    expect(text).toContain(formatExample(example.request));
    expect(text).toContain(formatExample(example.response));
  }
  expect(text).toContain("Authorization: Bearer <MOCK_API_KEY>");
  expect(text).toContain("Content-Type: application/json");
  for (const status of ["400", "401", "503"]) expect(text).toContain(status);
});
