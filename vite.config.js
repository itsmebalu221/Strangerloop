import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          realtime: ["socket.io-client"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    // strictPort removed — when 3000 is taken, Vite auto-picks the next
    // free port (3001, 3002…) and HMR follows along automatically.
  },
});
