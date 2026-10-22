import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims } }),
}));

beforeEach(() => {
  getClaims.mockReset();
});

test("홈 화면은 시작 안내 제목과 배포 링크를 보여준다", async () => {
  getClaims.mockResolvedValue({ data: null });
  render(await Home());

  expect(
    screen.getByRole("heading", { level: 1, name: /To get started/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Deploy Now/i })).toHaveAttribute(
    "href",
    expect.stringContaining("vercel.com/new")
  );
});

test("로그인하지 않았으면 로그인 링크를 보여준다", async () => {
  getClaims.mockResolvedValue({ data: null });
  render(await Home());

  expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("link", { name: "설정" })).not.toBeInTheDocument();
});

test("로그인했으면 설정 링크를 보여준다", async () => {
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } } });
  render(await Home());

  expect(screen.getByRole("link", { name: "설정" })).toHaveAttribute("href", "/settings");
  expect(screen.queryByRole("link", { name: "로그인" })).not.toBeInTheDocument();
});
