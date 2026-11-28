// Universal links: iOS opens https://boleia.ao/t/<id> in the app. Apple fetches this path without
// an extension and expects JSON, so it is a route and not a file in public/.
const APP_ID = '2FNB386G38.ao.boleia.app';
const TRIP_LINKS = '/t/*';

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');

  return {
    applinks: {
      details: [{ appIDs: [APP_ID], components: [{ '/': TRIP_LINKS }] }],
    },
  };
});
