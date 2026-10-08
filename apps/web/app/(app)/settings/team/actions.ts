"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form-state";
import { getData } from "@/lib/data/server";
import { formObject, toFormState } from "../../_lib/action-state";

// Owner-only rules live in the data layer; every action re-reads identity.

export async function createInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const data = await getData();
  const values = formObject(formData);
  try {
    const invite = await data.invites.createInvite(values);
    revalidatePath("/settings/team");
    return { status: "ok", message: `Invite saved for ${invite.email}.`, at: Date.now() };
  } catch (error) {
    return toFormState(error, values);
  }
}

export async function revokeInviteAction(inviteId: string): Promise<FormState> {
  const data = await getData();
  try {
    await data.invites.revokeInvite(inviteId);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath("/settings/team");
  return { status: "ok", message: "Invite revoked.", at: Date.now() };
}

export async function updateMemberRoleAction(memberId: string, role: string): Promise<FormState> {
  const data = await getData();
  try {
    await data.members.updateMemberRole(memberId, role);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Role updated.", at: Date.now() };
}

export async function removeMemberAction(memberId: string): Promise<FormState> {
  const data = await getData();
  try {
    await data.members.removeMember(memberId);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Member removed.", at: Date.now() };
}
