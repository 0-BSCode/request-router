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
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12">
      <section>
        <h1 className="text-2xl font-semibold">Guest request workspace</h1>
        <GuestMessageTester />
      </section>
    </main>
  );
}
