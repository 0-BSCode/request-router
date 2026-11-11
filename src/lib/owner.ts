import { z } from "zod";

export class OwnerSetupError extends Error {}

export function getOwnerEmail() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!z.email().safeParse(email).success) {
    throw new OwnerSetupError("Set OWNER_EMAIL to a valid email address.");
  }
  return email!;
}

export function getInitialOwnerPassword() {
  const password = process.env.OWNER_PASSWORD;
  if (!password || password.length < 8 || password.length > 128) {
    throw new OwnerSetupError("Set OWNER_PASSWORD to an initial password of 8 to 128 characters.");
  }
  return password;
}

export function isOwner(user: { email: string } | null | undefined) {
  if (!user) return false;
  try {
    return user.email.trim().toLowerCase() === getOwnerEmail();
  } catch {
    return false;
  }
}
