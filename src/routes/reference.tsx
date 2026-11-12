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
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Front desk tools
        </p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight">
          Mock API reference
        </h1>
        <MockApiReference />
      </section>
    </main>
  );
}
