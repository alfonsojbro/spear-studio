import { and, asc, eq } from "drizzle-orm";
import { socialAccount, type SocialAccount } from "@spear/db";
import { isUniqueViolation, NotFoundError, ValidationError } from "./errors";
import { getClient } from "./clients";
import { assertCanManageClients, type DataContext } from "./scope";
import { parseInput, socialAccountInput } from "./validation";

export async function listSocialAccounts(ctx: DataContext, clientId: string): Promise<SocialAccount[]> {
  await getClient(ctx, clientId);
  return ctx.db
    .select()
    .from(socialAccount)
    .where(eq(socialAccount.clientId, clientId))
    .orderBy(asc(socialAccount.platform), asc(socialAccount.handle));
}

export async function addSocialAccount(ctx: DataContext, clientId: string, input: unknown): Promise<SocialAccount> {
  await getClient(ctx, clientId);
  assertCanManageClients(ctx.viewer);
  const data = parseInput(socialAccountInput, input);
  try {
    const [row] = await ctx.db
      .insert(socialAccount)
      .values({ id: crypto.randomUUID(), clientId, createdBy: ctx.viewer.memberId, ...data })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError("This handle is already on the client.", { handle: "Already added." });
    }
    throw error;
  }
}

export async function removeSocialAccount(ctx: DataContext, clientId: string, accountId: string): Promise<void> {
  await getClient(ctx, clientId);
  assertCanManageClients(ctx.viewer);
  const deleted = await ctx.db
    .delete(socialAccount)
    .where(and(eq(socialAccount.id, accountId), eq(socialAccount.clientId, clientId)))
    .returning({ id: socialAccount.id });
  if (deleted.length === 0) throw new NotFoundError("Social account");
}
