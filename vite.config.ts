import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    // 테스트는 실제 서버(터널)를 부르지 않는다. 서버를 흉내 내는 테스트는 `vi.stubEnv`로 `live`를 켜고 `fetch`를 바꾼다
    env: { VITE_API_MODE: "mock" },
  },
});
