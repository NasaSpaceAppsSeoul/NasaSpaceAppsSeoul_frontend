import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { retry } from "../app/queryClient";
import { routes } from "../app/routes";

/** 테스트마다 새 QueryClient. 앱과 같은 재시도 규칙을 쓰되 기다리지 않는다. 캐시가 테스트끼리 섞이지 않는다. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry, retryDelay: 0, refetchOnWindowFocus: false } },
  });
}

/** 앱 라우트를 주어진 주소에서 그린다. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const client = createTestQueryClient();
  const result = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, client, ...result };
}
