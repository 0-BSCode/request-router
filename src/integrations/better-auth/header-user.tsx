import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { Link, useNavigate } from "@tanstack/react-router";

export default function BetterAuthHeader() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    );
  }

  if (session?.user) {
    const { user } = session;
    return (
      <div className="flex items-center gap-3">
        <div title={`Signed in as ${user.email}`} className="h-8 w-8 overflow-hidden rounded-full">
          {user.image ? (
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          )}
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
      </div>
    );
  }

  return (
    <Link
      to="/sign-in"
      className="h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center"
    >
      Sign in
    </Link>
  );
}
