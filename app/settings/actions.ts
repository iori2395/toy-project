"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", userId);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
