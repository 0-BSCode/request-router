import rawSamples from "../../../messages.jsonl?raw";
import { z } from "zod";
import { messageSchema } from "./contracts";

const sampleSchema = messageSchema.extend({ label: z.string(), expected: z.string() });
export const samples = rawSamples
  .trim()
  .split("\n")
  .map((line) => sampleSchema.parse(JSON.parse(line)));
export const testSenders = { whatsapp: "+15550100204", email: "guest@example.test" } as const;
