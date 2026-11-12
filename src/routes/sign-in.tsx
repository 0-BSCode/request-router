import { createFileRoute, redirect } from "@tanstack/react-router";

import AuthForm from "#/components/AuthForm";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/", replace: true });
  },
  component: () => <AuthForm />,
});
