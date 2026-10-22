import { Item, ItemContent, ItemGroup, ItemMedia } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_ROWS = 8;

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          경기도 인기 대출 도서
        </h1>
        <Skeleton className="h-5 w-32" />
      </header>
      <div role="status">
        <span className="sr-only">순위를 불러오는 중입니다</span>
        <ItemGroup aria-hidden>
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
            <Item key={i} role="listitem">
              <Skeleton className="h-5 w-8" />
              <ItemMedia variant="image" className="h-14 w-10">
                <Skeleton className="size-full" />
              </ItemMedia>
              <ItemContent>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </main>
  );
}
