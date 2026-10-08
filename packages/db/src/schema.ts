import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { AgencyRole, ClientRole } from "@spear/core";

/**
 * D1 schema. Mirrors migrations/0001_core.sql exactly; change both together.
 * D1 has no RLS: every read and write goes through apps/web/lib/data/*, which
 * scopes by the viewer's client access. Never query these tables elsewhere.
 */

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

const timestamps = {
  createdAt: text("created_at").notNull().default(nowIso),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowIso)
    .$onUpdateFn(() => new Date().toISOString()),
  createdBy: text("created_by"),
};

export const agency = sqliteTable("agency", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: text("settings", { mode: "json" }).$type<AgencySettings>().notNull().default(sql`'{}'`),
  ...timestamps,
});

export type AgencySettings = { staffEmailDomains?: string[] };

export const member = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    name: text("name"),
    role: text("role").$type<AgencyRole>().notNull(),
    ...timestamps,
  },
  (t) => [
    index("member_agency_idx").on(t.agencyId),
    check("member_email_lower", sql`${t.email} = lower(${t.email})`),
    check(
      "member_role_check",
      sql`${t.role} in ('owner', 'strategist', 'editor', 'account_manager', 'freelancer')`,
    ),
  ],
);

export const client = sqliteTable(
  "client",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull(),
    language: text("language").notNull(),
    region: text("region").notNull(),
    brandKit: text("brand_kit", { mode: "json" }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
    approvalRules: text("approval_rules", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
    archivedAt: text("archived_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("client_agency_slug_idx").on(t.agencyId, t.slug),
    index("client_agency_idx").on(t.agencyId),
  ],
);

export const clientMember = sqliteTable(
  "client_member",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    role: text("role").$type<ClientRole>().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("client_member_unique_idx").on(t.clientId, t.memberId),
    index("client_member_member_idx").on(t.memberId),
    check("client_member_role_check", sql`${t.role} in ('freelancer', 'client_approver', 'client_viewer')`),
  ],
);

export const PLATFORMS = ["ig", "tiktok", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const SOCIAL_STATUSES = ["manual", "connected", "needs_reconnect", "disconnected"] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export const socialAccount = sqliteTable(
  "social_account",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    platform: text("platform").$type<Platform>().notNull(),
    handle: text("handle").notNull(),
    status: text("status").$type<SocialStatus>().notNull().default("manual"),
    bufferChannelId: text("buffer_channel_id"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("social_account_unique_idx").on(t.clientId, t.platform, t.handle),
    check("social_account_platform_check", sql`${t.platform} in ('ig', 'tiktok', 'youtube')`),
    check(
      "social_account_status_check",
      sql`${t.status} in ('manual', 'connected', 'needs_reconnect', 'disconnected')`,
    ),
  ],
);

export const staffInvite = sqliteTable(
  "staff_invite",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agency.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<AgencyRole>().notNull(),
    clientId: text("client_id").references(() => client.id, { onDelete: "cascade" }),
    acceptedAt: text("accepted_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("staff_invite_open_email_idx").on(t.email).where(sql`accepted_at is null`),
    check("staff_invite_email_lower", sql`${t.email} = lower(${t.email})`),
    check(
      "staff_invite_role_check",
      sql`${t.role} in ('owner', 'strategist', 'editor', 'account_manager', 'freelancer')`,
    ),
  ],
);

export type Agency = typeof agency.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Client = typeof client.$inferSelect;
export type ClientMember = typeof clientMember.$inferSelect;
export type SocialAccount = typeof socialAccount.$inferSelect;
export type StaffInvite = typeof staffInvite.$inferSelect;
