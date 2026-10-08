"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form-state";
import { getData } from "@/lib/data/server";
import { formObject, toFormState } from "../../../_lib/action-state";

// Every action re-reads identity via getData(); the data layer re-checks client access and role.
// Bound ids come from the browser and are untrusted: the data layer scopes them.

export async function updateClientAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const data = await getData();
  const values = formObject(formData);
  try {
    await data.clients.updateClient(clientId, values);
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Saved.", at: Date.now() };
}

export async function addSocialAccountAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const data = await getData();
  const values = formObject(formData);
  try {
    await data.socialAccounts.addSocialAccount(clientId, values);
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Handle added.", at: Date.now() };
}

export async function removeSocialAccountAction(clientId: string, accountId: string): Promise<FormState> {
  const data = await getData();
  try {
    await data.socialAccounts.removeSocialAccount(clientId, accountId);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Handle removed.", at: Date.now() };
}

export async function setArchivedAction(clientId: string, archived: boolean): Promise<FormState> {
  const data = await getData();
  try {
    if (archived) await data.clients.archiveClient(clientId);
    else await data.clients.restoreClient(clientId);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: archived ? "Client archived." : "Client restored.", at: Date.now() };
}
