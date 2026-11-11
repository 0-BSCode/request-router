import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { isOwner } from "./owner";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [user] = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, session.userId));
          return isOwner(user) ? undefined : false;
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
});

export async function getOwnerSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session && isOwner(session.user) ? session : null;
}
