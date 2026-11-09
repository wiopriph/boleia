export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo({ path: '/entrar', query: { redirect: to.fullPath } });
  }

  if (user.value.app_metadata?.role !== 'admin') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }
});
