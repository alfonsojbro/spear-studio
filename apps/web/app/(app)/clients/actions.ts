"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { getData } from "@/lib/data/server";
import { formObject, toFormState } from "../_lib/action-state";

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // getData() re-checks identity on every call; the data layer re-checks the role.
  const data = await getData();
  const values = formObject(formData);
  let id: string;
  try {
    id = (await data.clients.createClient(values)).id;
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath("/", "layout");
  redirect(`/clients/${id}/settings?created=1`);
}
