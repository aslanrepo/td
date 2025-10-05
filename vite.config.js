import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [mkcert()],
  server: {
    https: true,
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    include: ['phaser', '@telegram-apps/sdk']
  }
});
