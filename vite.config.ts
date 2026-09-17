import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Libraries worth their own file: big, and changing far less often than the
 * app, so a deploy does not make every visitor fetch them again.
 *
 * Firebase is deliberately absent. It is only ever reached from the settings
 * card and the push service, so leaving it to be split by the code that
 * imports it keeps it out of the bundle every other page loads.
 */
const CHUNKS: Record<string, string[]> = {
  vendor: ['vue', 'vue-router', 'pinia'],
  supabase: ['@supabase/supabase-js'],
  charts: ['chart.js', 'vue-chartjs'],
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        // A function rather than the object form: Vite 8 bundles with
        // rolldown, which only takes the function and fails the build outright
        // on the object -- "manualChunks is not a function", after reporting
        // it as a warning first.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined

          for (const [chunk, packages] of Object.entries(CHUNKS)) {
            if (packages.some((name) => id.includes(`node_modules/${name}/`))) return chunk
          }

          return undefined
        },
      },
    },
  },
})
