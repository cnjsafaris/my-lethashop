import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Try to import cloudflare plugin at the top level
let cloudflarePlugin: any = null;
try {
  const cloudflareModule = require("@cloudflare/vite-plugin");
  cloudflarePlugin = cloudflareModule.cloudflare;
} catch (error) {
  console.warn('Cloudflare plugin not available, skipping...');
}

export default defineConfig(({ mode }) => {
  // Detect if we're building for Netlify
  const isNetlify = process.env.NETLIFY === 'true' || 
                   process.env.NETLIFY_BUILD_BASE !== undefined ||
                   process.env.NODE_ENV === 'production';
  
  const plugins = [
    react(),
  ];
  
  // Only add cloudflare plugin if not deploying to Netlify and plugin is available
  if (!isNetlify && cloudflarePlugin) {
    plugins.push(cloudflarePlugin());
  } else if (!isNetlify && mode === 'development') {
    // Try to load cloudflare plugin dynamically in development mode
    try {
      // Use require instead of import to avoid loading issues
      const { cloudflare } = require("@cloudflare/vite-plugin");
      plugins.push(cloudflare());
    } catch (error) {
      console.warn('Cloudflare plugin not available in this environment, continuing without it...');
    }
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
