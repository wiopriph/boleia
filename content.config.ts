import { defineCollection, defineContentConfig } from '@nuxt/content';


export default defineContentConfig({
  collections: {
    // static pages: content/paginas/regras.md -> /regras
    paginas: defineCollection({ type: 'page', source: { include: 'paginas/*.md', prefix: '/' } }),
    // optional hand-written text of a route page: content/rotas/<origem>-<destino>.md
    rotas: defineCollection({ type: 'page', source: { include: 'rotas/*.md', prefix: '/boleias' } }),
  },
});
