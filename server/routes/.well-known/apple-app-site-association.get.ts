// Universal links: iOS opens the home page and https://boleia.ao/t/<id> in the app. Apple fetches this path without
// an extension and expects JSON, so it is a route and not a file in public/.
const APP_ID = '2FNB386G38.ao.boleia.app';
// only the paths the app has a screen for
const APP_PATHS = ['/', '/t/*'];

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');

  return {
    applinks: {
      details: [{ appIDs: [APP_ID], components: APP_PATHS.map(path => ({ '/': path })) }],
    },
  };
});
