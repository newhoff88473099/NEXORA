"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

export async function updateFindingDescription(
  id: string,
  description: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("findings")
    .update({ description })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nao-conformidades/${id}`);
  return {};
}

export async function updateFindingRootCause(
  id: string,
  data: { root_cause_method: string; root_cause: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("findings")
    .update({ root_cause_method: data.root_cause_method, root_cause: data.root_cause })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nao-conformidades/${id}`);
  return {};
}

export async function updateFindingStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("findings")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nao-conformidades/${id}`);
  revalidatePath("/nao-conformidades");
  return {};
}

export async function createActionFromFinding(
  findingId: string,
  orgId: string,
  data: { type: string; description: string }
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: action, error } = await supabase
    .from("actions")
    .insert({ finding_id: findingId, org_id: orgId, type: data.type, description: data.description })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/nao-conformidades/${findingId}`);
  revalidatePath("/acoes");
  return { id: action.id };
}
