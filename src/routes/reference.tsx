import { createFileRoute, redirect } from "@tanstack/react-router";

import { MockApiReference } from "#/components/MockApiReference";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/reference")({
  beforeLoad: async () => {
    const user = await getSession();
    if (!user) throw redirect({ to: "/sign-in" });
    return { user };
  },
  component: Reference,
});

function Reference() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12">
      <section>
        <h1 className="text-2xl font-semibold">Mock API reference</h1>
        <MockApiReference />
      </section>
    </main>
  );
}
