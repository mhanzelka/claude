import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The build lands in ../web because ask.py serves that directory directly; the output is
// committed so that running the tool never needs node installed. Everything under ui/ is
// the workshop — only needed to change the page, never to use it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '',
  build: {
    outDir: '../web',
    emptyOutDir: true,
    // Fixed names, no content hash: the page is served with no-store, so a hash buys nothing
    // and would add two new files to git history on every rebuild.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/app[extname]',
      },
    },
  },
})
