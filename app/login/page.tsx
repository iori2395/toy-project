import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

import { signIn, signUp } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/settings");

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            이메일과 비밀번호로 로그인하거나 새 계정을 만드세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
              </Field>
              {typeof error === "string" && <FieldError>{error}</FieldError>}
              <Field orientation="horizontal">
                <Button type="submit" formAction={signIn}>
                  로그인
                </Button>
                <Button type="submit" variant="outline" formAction={signUp}>
                  회원가입
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
