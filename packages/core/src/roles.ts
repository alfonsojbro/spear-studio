/**
 * Role model. Mirrors the CHECK constraints in packages/db/migrations/0001_core.sql
 * and packages/db/src/schema.ts. Keep all three in sync.
 *
 * Access to data comes only from `member` / `client_member` rows, enforced by the
 * scoped data layer in apps/web/lib/data.
 */

export const AGENCY_ROLES = [
  "owner",
  "strategist",
  "editor",
  "account_manager",
  "freelancer",
] as const;
export type AgencyRole = (typeof AGENCY_ROLES)[number];

export const CLIENT_ROLES = ["freelancer", "client_approver", "client_viewer"] as const;
export type ClientRole = (typeof CLIENT_ROLES)[number];

/** Roles that may create and edit clients. Matches `assertCanManageClients` in apps/web/lib/data/scope.ts. */
export const CLIENT_MANAGER_ROLES = ["owner", "strategist", "account_manager"] as const satisfies readonly AgencyRole[];

/** Roles allowed to invite staff and change membership. */
export const TEAM_MANAGER_ROLES = ["owner"] as const satisfies readonly AgencyRole[];

export const ROLE_LABELS: Record<AgencyRole | ClientRole, string> = {
  owner: "Owner",
  strategist: "Strategist",
  editor: "Editor",
  account_manager: "Account manager",
  freelancer: "Freelancer",
  client_approver: "Client approver",
  client_viewer: "Client viewer",
};

export function isAgencyRole(value: unknown): value is AgencyRole {
  return typeof value === "string" && (AGENCY_ROLES as readonly string[]).includes(value);
}

export function isClientRole(value: unknown): value is ClientRole {
  return typeof value === "string" && (CLIENT_ROLES as readonly string[]).includes(value);
}

/**
 * Agency staff see every client of their agency. Freelancers are not staff:
 * they only see clients they are attached to via `client_member`.
 * Mirrors `clientReadScope` in apps/web/lib/data/scope.ts.
 */
export function isAgencyStaff(role: AgencyRole | null | undefined): boolean {
  return role != null && role !== "freelancer";
}

export function canManageClients(role: AgencyRole | null | undefined): boolean {
  return role != null && (CLIENT_MANAGER_ROLES as readonly string[]).includes(role);
}

export function canManageTeam(role: AgencyRole | null | undefined): boolean {
  return role != null && (TEAM_MANAGER_ROLES as readonly string[]).includes(role);
}

/** Roles an owner may assign through an invite. */
export const INVITABLE_ROLES = AGENCY_ROLES;

/** An invite with a client attached gives a client_member row. Only freelancers are invited per client in P0. */
export function inviteNeedsClient(role: AgencyRole): boolean {
  return role === "freelancer";
}

export function roleLabel(role: string): string {
  return isAgencyRole(role) || isClientRole(role) ? ROLE_LABELS[role] : role;
}
