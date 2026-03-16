import tailwindcssVite from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',

  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3000/api/",
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_KEY || "BPzJIlZgpC6eUT9FxnezScfezfh3LU-ODCVxE5KJn9GvqDA7_Qbnn7WUc4sPwZPUSGx_SHZyr7mBjOLltPxVpMk",
    },
  },

  devServer: {
    port: 3001,
  },

  plugins: [
    "~/plugins/api.client.js",
    "~/plugins/webpush.client.js",
  ],

  vite: {
    plugins: [tailwindcssVite()],
  },

  css: [
    '~/assets/css/input.css',
  ],

  build: {
    transpile: ['leaflet']
  },
});