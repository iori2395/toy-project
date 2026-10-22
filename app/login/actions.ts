"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

function backToLogin(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    readCredentials(formData),
  );

  if (error) backToLogin(error.message);
  redirect("/settings");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(readCredentials(formData));

  if (error) backToLogin(error.message);
  // With email confirmation off, signUp returns a session right away.
  if (!data.session) backToLogin("가입은 됐지만 세션이 없습니다. 이메일 확인 설정을 확인하세요.");
  redirect("/settings");
}
