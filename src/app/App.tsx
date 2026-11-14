import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { followDocumentLang } from "./documentLang";
import { followDocumentTheme } from "./documentTheme";
import { queryClient } from "./queryClient";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

followDocumentLang(router);
followDocumentTheme(router);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
