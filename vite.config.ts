import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    // Ensure absolute base so asset links are absolute (prevents broken paths on nested routes)
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5176,
      strictPort: false,
      hmr: false,
      watch: {
        ignored: [
          "**/backend/db.json",
          "**/backend/uploads/**",
          "**/backend/*.log",
          "**/dist/**",
        ],
      },
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
    },
    build: {
      target: "es2020",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: true,
        },
      },
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Optimized chunk naming for better caching
          entryFileNames: "js/[name]-[hash].js",
          chunkFileNames: "js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/png|jpe?g|gif|svg|webp|ico/.test(ext)) {
              return `images/[name]-[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
              return `fonts/[name]-[hash][extname]`;
            } else if (ext === "css") {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-icons": ["lucide-react"],
            "vendor-charts": ["recharts"],
            "vendor-ui": ["framer-motion"],
          },
        },
        // Optimize input options
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
      // Inline smaller assets
      assetsInlineLimit: 10000,
      // Report compressed size
      reportCompressedSize: true,
      sourcemap: mode !== "production",
    },
  };
});
