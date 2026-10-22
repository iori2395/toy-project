const ENDPOINT = "https://openapi.gg.go.kr/Poplitloanbook";
const PAGE_SIZE = 1000;
const NO_DATA = "INFO-200";
const MAX_RANK = 500;

export type PopularLoan = {
  rank: number;
  title: string;
  volume: number | null;
  author: string;
  coverUrl: string | null;
};

export type PopularLoanRanking = {
  month: { year: number; month: number };
  books: PopularLoan[];
};

export class PopularLoansUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PopularLoansUnavailableError";
  }
}

type Row = {
  STD_YM: string;
  RKI_NO: number;
  BOOK_NM_INFO: string;
  AUTHOR_NM_INFO: string;
  // Series of the same title differ only here (e.g. 흔한남매 1-22).
  VOLM_CNT?: number | null;
  BOOK_IMAGE_URL: string | null;
};

// "소년이 온다 :한강 장편소설" -> "소년이 온다"
function cleanTitle(raw: string) {
  const cut = raw.indexOf(" :");
  return (cut === -1 ? raw : raw.slice(0, cut)).trim();
}

async function fetchPage(key: string, pageIndex: number) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("KEY", key);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(pageIndex));
  url.searchParams.set("pSize", String(PAGE_SIZE));

  const response = await fetch(url, { cache: "no-store" });
  // A blocked request gets an HTML notice instead of JSON.
  const body = await response.json().catch((cause) => {
    throw new PopularLoansUnavailableError("Ranking response was not JSON", { cause });
  });
  // Without data, and on errors such as a bad key, the API returns only a
  // top-level RESULT code instead of the Poplitloanbook payload.
  if (body.RESULT?.CODE === NO_DATA) return { total: 0, rows: [] };
  if (!Array.isArray(body.Poplitloanbook)) {
    throw new PopularLoansUnavailableError(
      `Ranking API returned ${body.RESULT?.CODE ?? "an unexpected response"}`,
    );
  }

  const [{ head }, { row }] = body.Poplitloanbook;
  return { total: head[0].list_total_count as number, rows: row as Row[] };
}

// The server may cap pSize below what we ask for, so keep paging until
// the reported total is collected or a page comes back empty.
async function fetchRows(): Promise<Row[]> {
  // Without a key the API silently serves the 5-row sample, so refuse early.
  const key = process.env.GYEONGGI_OPENAPI_KEY;
  if (!key) throw new PopularLoansUnavailableError("GYEONGGI_OPENAPI_KEY is not set");

  const rows: Row[] = [];
  for (let pageIndex = 1; ; pageIndex++) {
    const page = await fetchPage(key, pageIndex);
    rows.push(...page.rows);
    if (rows.length >= page.total || page.rows.length === 0) return rows;
  }
}

export async function getLatestPopularLoans(): Promise<PopularLoanRanking | null> {
  const rows = await fetchRows();
  if (rows.length === 0) return null;

  const latest = rows.reduce((max, r) => (r.STD_YM > max ? r.STD_YM : max), "");

  const books = rows
    // Ranks use competition ranking (498, 498, 498, 501), so ties stay and
    // the cut is by rank, not by row count.
    .filter((r) => r.STD_YM === latest && r.RKI_NO <= MAX_RANK)
    .sort((a, b) => a.RKI_NO - b.RKI_NO)
    .map((r) => ({
      rank: r.RKI_NO,
      title: cleanTitle(r.BOOK_NM_INFO),
      volume: r.VOLM_CNT ?? null,
      author: r.AUTHOR_NM_INFO,
      coverUrl: r.BOOK_IMAGE_URL || null,
    }));
  if (books.length === 0) return null;

  return {
    month: { year: Number(latest.slice(0, 4)), month: Number(latest.slice(4, 6)) },
    books,
  };
}
