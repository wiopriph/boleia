export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo({ path: '/entrar', query: { redirect: to.fullPath } });
  }
});
