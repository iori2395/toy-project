import Image from "next/image";
import { BookOpenIcon, CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { getLatestPopularLoans } from "@/lib/popular-loans";

// Render per request so the ranking is never frozen at build time.
export const dynamic = "force-dynamic";

async function loadRanking() {
  try {
    return { ranking: await getLatestPopularLoans(), failed: false };
  } catch (error) {
    // Covers network failures too, not only PopularLoansUnavailableError.
    console.error("Failed to load popular loans", error);
    return { ranking: null, failed: true };
  }
}

export default async function Home() {
  const { ranking, failed } = await loadRanking();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          경기도 인기 대출 도서
        </h1>
        {ranking && (
          <p className="text-muted-foreground">
            {ranking.month.year}년 {ranking.month.month}월 대출 기준
          </p>
        )}
      </header>
      {failed ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>순위를 불러오지 못했습니다</AlertTitle>
          <AlertDescription>잠시 뒤에 다시 열어 주세요.</AlertDescription>
        </Alert>
      ) : ranking ? (
        <ItemGroup>
          {ranking.books.map((book, index) => (
            // Tied books share a rank, so the rank alone is not a unique key.
            <Item key={`${book.rank}-${index}`} role="listitem">
              <span className="w-8 text-right font-semibold tabular-nums">{book.rank}</span>
              <ItemMedia variant="image" className="h-14 w-10">
                {book.coverUrl && (
                  <Image src={book.coverUrl} alt="" width={40} height={56} unoptimized />
                )}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{book.title}</ItemTitle>
                <ItemDescription>{book.author}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>아직 공개된 순위가 없습니다</EmptyTitle>
            <EmptyDescription>경기도 인기 대출 순위가 공개되면 여기에 보입니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
