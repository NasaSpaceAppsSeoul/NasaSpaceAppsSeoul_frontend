import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { followDocumentLang } from "./documentLang";
import { queryClient } from "./queryClient";
import { routes } from "./routes";
import { withRouteTransitions } from "./routeTransition";

const router = createBrowserRouter(routes);

followDocumentLang(router);
withRouteTransitions(router);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
