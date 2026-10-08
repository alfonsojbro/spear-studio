import { describe, expect, it } from "vitest";
import {
  AGENCY_ROLES,
  CLIENT_ROLES,
  canManageClients,
  canManageTeam,
  inviteNeedsClient,
  isAgencyRole,
  isAgencyStaff,
  isClientRole,
  roleLabel,
} from "../src/roles";

describe("role guards", () => {
  it("recognises every agency role and rejects others", () => {
    for (const role of AGENCY_ROLES) expect(isAgencyRole(role)).toBe(true);
    expect(isAgencyRole("client_viewer")).toBe(false);
    expect(isAgencyRole("admin")).toBe(false);
    expect(isAgencyRole(undefined)).toBe(false);
  });

  it("recognises every client role and rejects others", () => {
    for (const role of CLIENT_ROLES) expect(isClientRole(role)).toBe(true);
    expect(isClientRole("owner")).toBe(false);
    expect(isClientRole(42)).toBe(false);
  });
});

describe("role mapping", () => {
  it("treats every agency role except freelancer as staff", () => {
    expect(isAgencyStaff("owner")).toBe(true);
    expect(isAgencyStaff("strategist")).toBe(true);
    expect(isAgencyStaff("editor")).toBe(true);
    expect(isAgencyStaff("account_manager")).toBe(true);
    expect(isAgencyStaff("freelancer")).toBe(false);
    expect(isAgencyStaff(null)).toBe(false);
    expect(isAgencyStaff(undefined)).toBe(false);
  });

  it("lets only owner, strategist and account manager manage clients", () => {
    expect(canManageClients("owner")).toBe(true);
    expect(canManageClients("strategist")).toBe(true);
    expect(canManageClients("account_manager")).toBe(true);
    expect(canManageClients("editor")).toBe(false);
    expect(canManageClients("freelancer")).toBe(false);
    expect(canManageClients(null)).toBe(false);
  });

  it("lets only the owner manage the team", () => {
    for (const role of AGENCY_ROLES) expect(canManageTeam(role)).toBe(role === "owner");
    expect(canManageTeam(undefined)).toBe(false);
  });

  it("requires a client only for freelancer invites", () => {
    expect(inviteNeedsClient("freelancer")).toBe(true);
    expect(inviteNeedsClient("editor")).toBe(false);
  });

  it("labels known roles and passes unknown ones through", () => {
    expect(roleLabel("account_manager")).toBe("Account manager");
    expect(roleLabel("client_viewer")).toBe("Client viewer");
    expect(roleLabel("mystery")).toBe("mystery");
  });
});
