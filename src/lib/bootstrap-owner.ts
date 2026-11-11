import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";

import { db } from "#/db";
import { account, user } from "#/db/schema";
import { getInitialOwnerPassword, getOwnerEmail, OwnerSetupError } from "./owner";

export async function bootstrapOwner() {
  const email = getOwnerEmail();
  return db.transaction(async (tx) => {
    // Serialize first starts so no instance observes a partially provisioned owner.
    await tx.execute(sql`select pg_advisory_xact_lock(1128352844)`);
    const users = await tx.select().from(user).limit(2);
    if (users.length > 0) {
      if (users.length !== 1 || users[0].email !== email) {
        throw new OwnerSetupError(
          "Owner setup refused: use a fresh database or restore the email of its sole existing owner. No accounts were changed.",
        );
      }
      const credentials = await tx
        .select()
        .from(account)
        .where(and(eq(account.userId, users[0].id), eq(account.providerId, "credential")))
        .limit(2);
      if (
        credentials.length !== 1 ||
        credentials[0].accountId !== users[0].id ||
        !credentials[0].password
      ) {
        throw new OwnerSetupError(
          "Owner setup refused: the existing owner has incomplete password credentials. No accounts were changed.",
        );
      }
      return "existing";
    }

    const password = await hashPassword(getInitialOwnerPassword());
    const id = crypto.randomUUID();
    await tx.insert(user).values({ id, email, name: "Owner" });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password,
    });
    return "created";
  });
}
