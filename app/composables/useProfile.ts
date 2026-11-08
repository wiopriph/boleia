import type { Tables, UpsertProfilePayload } from '~~/types/rpc'

export type Profile = Tables<'profiles'>

// Own profile row (RLS: own row only). Loaded once per session, refreshed after upsert_profile.
export function useProfile() {
  const db = useDb()
  const user = useSupabaseUser()
  const { rpc } = useRpc()
  const profile = useState<Profile | null>('profile', () => null)
  const loaded = useState<string | null>('profile-loaded-for', () => null)

  async function load(force = false, userId = user.value?.id) {
    if (!userId) {
      profile.value = null
      loaded.value = null
      return null
    }
    if (!force && loaded.value === userId) return profile.value
    const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
    profile.value = data
    loaded.value = userId
    return data
  }

  async function update(payload: UpsertProfilePayload) {
    const row = await rpc('upsert_profile', { payload: payload as never })
    profile.value = row as Profile
    return profile.value
  }

  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')
  const isComplete = computed(() => !!profile.value && profile.value.display_name.trim().length >= 2)

  return { profile, load, update, isAdmin, isComplete }
}
