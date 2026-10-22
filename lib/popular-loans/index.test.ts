import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { getLatestPopularLoans, PopularLoansUnavailableError } from "@/lib/popular-loans";

type Row = {
  STD_YM: string;
  RKI_NO: number;
  BOOK_NM_INFO: string;
  AUTHOR_NM_INFO: string;
  VOLM_CNT?: number | null;
  BOOK_IMAGE_URL: string | null;
};

function row(month: string, rank: number, title: string, image: string | null = null): Row {
  return {
    STD_YM: month,
    RKI_NO: rank,
    BOOK_NM_INFO: title,
    AUTHOR_NM_INFO: `지은이: 저자${rank}`,
    BOOK_IMAGE_URL: image,
  };
}

function okBody(total: number, rows: Row[]) {
  return {
    Poplitloanbook: [
      {
        head: [
          { list_total_count: total },
          { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } },
          { api_version: "1.0" },
        ],
      },
      { row: rows },
    ],
  };
}

function respondWith(...bodies: unknown[]) {
  const fetchMock = vi.fn();
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce(
      new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 }),
    );
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("GYEONGGI_OPENAPI_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("가장 최근 기준 달의 순위만 1위부터 돌려준다", async () => {
  respondWith(
    okBody(4, [
      row("202608", 2, "안녕이라 그랬어 :김애란 소설"),
      row("202607", 1, "지난달 1위"),
      row("202608", 1, "소년이 온다 :한강 장편소설", "https://image.example/cover.jpg"),
      row("202607", 2, "지난달 2위"),
    ]),
  );

  const ranking = await getLatestPopularLoans();

  expect(ranking).toEqual({
    month: { year: 2026, month: 8 },
    books: [
      {
        rank: 1,
        title: "소년이 온다",
        volume: null,
        author: "지은이: 저자1",
        coverUrl: "https://image.example/cover.jpg",
      },
      { rank: 2, title: "안녕이라 그랬어", volume: null, author: "지은이: 저자2", coverUrl: null },
    ],
  });
});

test("권차가 있으면 함께 돌려주고 없으면 null로 둔다", async () => {
  respondWith(
    okBody(2, [
      { ...row("202608", 1, "흔한남매"), VOLM_CNT: 19 },
      { ...row("202608", 2, "불편한 편의점 :김호연 장편소설"), VOLM_CNT: null },
    ]),
  );

  const ranking = await getLatestPopularLoans();

  expect(ranking?.books.map((b) => [b.title, b.volume])).toEqual([
    ["흔한남매", 19],
    ["불편한 편의점", null],
  ]);
});

test("500위까지만 돌려주고 공동 순위는 같은 순위로 모두 남긴다", async () => {
  respondWith(
    okBody(5, [
      row("202608", 498, "공동 498위 A"),
      row("202608", 498, "공동 498위 B"),
      row("202608", 500, "500위"),
      row("202608", 501, "501위"),
      row("202608", 999, "999위"),
    ]),
  );

  const ranking = await getLatestPopularLoans();

  expect(ranking?.books.map((b) => [b.rank, b.title])).toEqual([
    [498, "공동 498위 A"],
    [498, "공동 498위 B"],
    [500, "500위"],
  ]);
});

test("가장 최근 달에 500위 이내 항목이 없으면 null을 돌려준다", async () => {
  respondWith(okBody(1, [row("202608", 501, "501위")]));

  await expect(getLatestPopularLoans()).resolves.toBeNull();
});

test("데이터가 없다는 응답이면 순위 대신 null을 돌려준다", async () => {
  respondWith({ RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." } });

  await expect(getLatestPopularLoans()).resolves.toBeNull();
});

test("JSON이 아닌 차단 안내 페이지가 오면 순위를 받을 수 없다는 오류를 낸다", async () => {
  respondWith("<html><body>보안 정책에 의해 차단되었습니다</body></html>");

  await expect(getLatestPopularLoans()).rejects.toBeInstanceOf(PopularLoansUnavailableError);
});

test("인증키 오류 같은 API 오류 코드가 오면 순위를 받을 수 없다는 오류를 낸다", async () => {
  respondWith({ RESULT: { CODE: "ERROR-290", MESSAGE: "인증키가 유효하지 않습니다." } });

  await expect(getLatestPopularLoans()).rejects.toBeInstanceOf(PopularLoansUnavailableError);
});

test("인증키가 설정되지 않았으면 요청하지 않고 오류를 낸다", async () => {
  vi.stubEnv("GYEONGGI_OPENAPI_KEY", "");
  const fetchMock = respondWith(okBody(1, [row("202608", 1, "샘플")]));

  await expect(getLatestPopularLoans()).rejects.toBeInstanceOf(PopularLoansUnavailableError);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("한 페이지에 다 오지 않으면 전체 건수를 채울 때까지 다음 페이지를 받는다", async () => {
  const fetchMock = respondWith(
    okBody(3, [row("202608", 1, "첫째"), row("202608", 2, "둘째")]),
    okBody(3, [row("202608", 3, "셋째")]),
  );

  const ranking = await getLatestPopularLoans();

  expect(ranking?.books.map((b) => b.rank)).toEqual([1, 2, 3]);
  const pages = fetchMock.mock.calls.map(([url]) => new URL(String(url)).searchParams);
  expect(pages.map((p) => p.get("pIndex"))).toEqual(["1", "2"]);
  expect(pages.every((p) => p.get("KEY") === "test-key")).toBe(true);
});
