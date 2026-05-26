import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  server: {
    preset: "vercel",
  },
  define: {
    "import.meta.env.VITE_TENANT_ID": JSON.stringify(
      process.env.VITE_TENANT_ID ?? "example-client"
    ),
  },
});
