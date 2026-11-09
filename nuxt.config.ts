export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
  ],

  // site.url comes from NUXT_PUBLIC_SITE_URL at runtime (nuxt-site-config), request origin in dev
  site: {
    name: 'Boleia',
    description: 'Boleias entre cidades em Angola com pagamento protegido.',
    defaultLocale: 'pt-AO',
  },

  // private areas: no indexing, no sitemap; sitemap sources are configured with the SEO pages (step 12)
  robots: {
    disallow: ['/conta', '/admin', '/entrar', '/publicar', '/avaliar', '/pesquisa'],
  },
  sitemap: {
    exclude: ['/conta/**', '/admin/**', '/entrar', '/publicar', '/avaliar/**', '/pesquisa'],
  },
  schemaOrg: { enabled: false },
  linkChecker: { enabled: false },

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  supabase: {
    // url and key come from SUPABASE_URL / SUPABASE_KEY in .env
    redirect: false,
    types: '~~/types/database.ts',
    clientOptions: {
      auth: {
        // phone + OTP: no OAuth redirects, so no PKCE/url parsing needed
        flowType: 'implicit',
        detectSessionInUrl: false,
      },
    },
  },
});
