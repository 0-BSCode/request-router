import { createFileRoute } from "@tanstack/react-router";
import { createMockTask } from "#/lib/guest-routing/mocks.server";

export const Route = createFileRoute("/api/mock/tasks")({
  server: { handlers: { POST: ({ request }) => createMockTask(request) } },
});
