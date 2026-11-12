import { createFileRoute, redirect } from "@tanstack/react-router";

import { GuestMessageTester } from "#/components/GuestMessageTester";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getSession();
    if (!user) throw redirect({ to: "/sign-in" });
    return { user };
  },
  component: Workspace,
});

function Workspace() {
  return (
    <main className="mx-auto box-content min-h-[70vh] max-w-6xl px-6 py-12">
      <section>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Front desk tools
        </p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight">Request router</h1>
        <GuestMessageTester />
      </section>
    </main>
  );
}
