import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Capacitor loads the built app from a local WebView origin.
  // Relative asset paths keep JS, CSS and images available inside the APK.
  base: './',
  plugins: [react()],
})
