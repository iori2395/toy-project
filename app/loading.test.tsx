import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Loading from "@/app/loading";

test("순위를 받아 오는 동안 불러오는 중임을 알린다", () => {
  render(<Loading />);

  expect(screen.getByRole("status")).toHaveTextContent("순위를 불러오는 중입니다");
});
