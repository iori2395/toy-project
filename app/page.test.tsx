import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

function respondWith(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 }),
    ),
  );
}

function rankingBody(rows: Array<[number, string, string]>) {
  return {
    Poplitloanbook: [
      {
        head: [
          { list_total_count: rows.length },
          { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } },
        ],
      },
      {
        row: rows.map(([rank, title, author]) => ({
          STD_YM: "202608",
          RKI_NO: rank,
          BOOK_NM_INFO: title,
          AUTHOR_NM_INFO: author,
          BOOK_IMAGE_URL: null,
        })),
      },
    ],
  };
}

beforeEach(() => {
  vi.stubEnv("GYEONGGI_OPENAPI_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("홈 화면은 기준 달과 함께 인기 대출 도서를 순위대로 보여준다", async () => {
  respondWith(
    rankingBody([
      [2, "안녕이라 그랬어 :김애란 소설", "지은이: 김애란"],
      [1, "소년이 온다 :한강 장편소설", "지은이: 한강"],
    ]),
  );

  render(await Home());

  expect(screen.getByText("2026년 8월 대출 기준")).toBeInTheDocument();
  const items = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent("1");
  expect(items[0]).toHaveTextContent("소년이 온다");
  expect(items[0]).toHaveTextContent("지은이: 한강");
  expect(items[0]).not.toHaveTextContent("장편소설");
  expect(items[1]).toHaveTextContent("안녕이라 그랬어");
});

test("순위 데이터가 없으면 빈 목록 대신 결과가 없다고 안내한다", async () => {
  respondWith({ RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." } });

  render(await Home());

  expect(screen.getByText("아직 공개된 순위가 없습니다")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

test("순위를 받아 오지 못하면 화면을 깨뜨리지 않고 오류를 안내한다", async () => {
  respondWith("<html><body>보안 정책에 의해 차단되었습니다</body></html>");

  render(await Home());

  expect(screen.getByRole("alert")).toHaveTextContent("순위를 불러오지 못했습니다");
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});
