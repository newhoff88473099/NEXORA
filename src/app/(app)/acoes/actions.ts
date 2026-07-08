"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateActionStatus(id: string, status: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const update: Record<string, unknown> = { status };
  if (status === "verificada") {
    update.verified_by = user.id;
    update.verified_at = new Date().toISOString();
  }

  await supabase.from("actions").update(update).eq("id", id);
  revalidatePath("/acoes");
  revalidatePath(`/acoes/${id}`);
}

export async function updateActionDetails(
  id: string,
  data: { description?: string; type?: string; due_date?: string | null; owner_id?: string | null }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("actions").update(data).eq("id", id);
  revalidatePath(`/acoes/${id}`);
  revalidatePath("/acoes");
}

export async function updateEvidence(id: string, evidence_photos: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("actions").update({ evidence_photos }).eq("id", id);
  revalidatePath(`/acoes/${id}`);
}
