export default defineNuxtConfig({
  app: {
    head: {
      title: "Khito",
      link: [
        {
          rel: "icon",
          href: "/logo_black.ico",
          media: "(prefers-color-scheme: light)",
        },
        {
          rel: "icon",
          href: "/logo_white.ico",
          media: "(prefers-color-scheme: dark)",
        },
      ],
    },
  },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt", "@clerk/nuxt"],
  clerk: {
    skipServerMiddleware: true,
  },
  ui: {
    colorMode: false,
  },
  css: ["~/assets/css/main.css"],
  nitro: {
    preset: "cloudflare_module",
  },
});
