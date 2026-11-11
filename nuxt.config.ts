export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@nuxt/content',
  ],

  // site.url comes from NUXT_PUBLIC_SITE_URL at runtime (nuxt-site-config), request origin in dev
  site: {
    name: 'Boleia',
    description: 'Boleias entre cidades em Angola com pagamento protegido.',
    defaultLocale: 'pt-AO',
  },

  // private areas: no indexing, no sitemap
  robots: {
    // robots rules are prefix matches: '/conta' would also close /contactos
    disallow: ['/conta/', '/admin', '/entrar', '/publicar', '/avaliar/', '/pesquisa'],
  },
  sitemap: {
    exclude: ['/conta/**', '/admin/**', '/entrar', '/publicar', '/avaliar/**', '/pesquisa'],
    // static texts, routes and cities come from the content collection and route_stats
    sources: ['/api/__sitemap__/urls'],
  },
  schemaOrg: { enabled: false },
  linkChecker: { enabled: false },

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      // NUXT_PUBLIC_SUPPORT_EMAIL, shown on /contactos
      supportEmail: '',
      // declared so NUXT_PUBLIC_SITE_INDEXABLE=false can close indexing at runtime (Worker var)
      site: { indexable: true },
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module',
  },

  // D1 binding DB on Workers (wrangler.jsonc), node:sqlite in dev and at build time
  content: {
    database: { type: 'd1', bindingName: 'DB' },
    experimental: { sqliteConnector: 'native' },
    // no code blocks in the texts; shiki would add its wasm to the Worker bundle
    build: { markdown: { highlight: false } },
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
