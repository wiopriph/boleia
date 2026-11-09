// useSupabaseUser() holds the JWT claims (module v2), so the id is `sub`, not `id`.
export function useUserId() {
  const user = useSupabaseUser();

  return computed(() => (typeof user.value?.sub === 'string' ? user.value.sub : null));
}
