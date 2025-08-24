import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig(({ mode }) => {
  const isNetlify = mode === 'production' || process.env.NETLIFY === 'true';
  
  const plugins = [
    ...mochaPlugins(process.env as any),
    react(),
  ];
  
  // Only add cloudflare plugin if not deploying to Netlify
  if (!isNetlify) {
    plugins.push(cloudflare());
  }
  
  return {
    plugins,
    server: {
      allowedHosts: true,
    },
    build: {
      chunkSizeWarningLimit: 5000,
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  };
});
