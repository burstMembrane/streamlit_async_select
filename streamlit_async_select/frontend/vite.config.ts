import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from "@tailwindcss/vite"
// @ts-ignore
import PluginObject from 'babel-plugin-react-compiler'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  // @ts-ignore
  plugins: [[PluginObject], react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
