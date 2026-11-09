// /entrar when already signed in: go where the user was heading.
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  if (user.value) {
    const redirect = typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/') ? to.query.redirect : '/';

    return navigateTo(redirect);
  }
});
