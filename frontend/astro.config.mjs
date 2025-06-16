// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
  
  // Configuración de output según el entorno
  output: process.env.NODE_ENV === 'production' ? 'server' : 'static',
  
  // Usar el adaptador sólo en producción
  adapter: process.env.NODE_ENV === 'production' ? vercel({}) : undefined,
});