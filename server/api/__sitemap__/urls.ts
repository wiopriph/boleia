import { queryCollection } from '@nuxt/content/server';
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~~/types/database';


// Dynamic sitemap entries: static texts, every route pair of route_stats and every city with a route.
export default defineSitemapEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);

  const [pages, { data: routes }] = await Promise.all([
    queryCollection(event, 'paginas').select('path')
      .all(),
    client.from('route_stats').select('origin_slug, destination_slug, refreshed_at'),
  ]);

  const origins = new Set((routes ?? []).map(route => route.origin_slug));

  return [
    ...pages.map(page => ({ loc: page.path })),
    ...[...origins].map(origin => ({ loc: `/boleias/${origin}` })),
    ...(routes ?? []).map(route => ({
      loc: `/boleias/${route.origin_slug}-${route.destination_slug}`,
      lastmod: route.refreshed_at ?? undefined,
    })),
  ];
});
