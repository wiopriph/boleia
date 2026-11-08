export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase', '@vueuse/nuxt'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module'
  },

  typescript: { strict: true, typeCheck: false },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  supabase: {
    // url and key come from SUPABASE_URL / SUPABASE_KEY in .env
    redirect: false,
    types: '~~/types/database.ts',
    clientOptions: {
      auth: {
        // phone + OTP: no OAuth redirects, so no PKCE/url parsing needed
        flowType: 'implicit',
        detectSessionInUrl: false
      }
    }
  }
})
