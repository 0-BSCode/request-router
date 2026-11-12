import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { GuestMessageTester } from "#/components/GuestMessageTester";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
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
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <h1 className="text-xl font-semibold">{user.email}</h1>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await authClient.signOut();
            if (!result.error) void navigate({ to: "/sign-in", replace: true });
          }}
        >
          Sign out
        </Button>
      </header>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Guest request workspace</h2>
        <GuestMessageTester />
      </section>
    </main>
  );
}
