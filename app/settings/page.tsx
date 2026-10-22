import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

import { signOut, updateDisplayName } from "./actions";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .maybeSingle();

  const { error, saved } = await searchParams;
  const message = profileError?.message ?? (typeof error === "string" ? error : null);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>설정</CardTitle>
          <CardDescription>{claims.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDisplayName}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="display_name">표시 이름</FieldLabel>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={profile?.display_name ?? ""}
                  maxLength={50}
                />
                {saved && !message && <FieldDescription>저장했습니다.</FieldDescription>}
              </Field>
              {message && <FieldError>{message}</FieldError>}
              <Field orientation="horizontal">
                <Button type="submit">저장</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
