import type { Tables, UpsertVehiclePayload } from '~~/types/rpc'

export type Vehicle = Tables<'vehicles'>

// Own vehicles (RLS: owner only). Writes go through upsert_vehicle; "remove" is status = removed.
export function useVehicles() {
  const db = useDb()
  const userId = useUserId()
  const { rpc } = useRpc()
  const vehicles = useState<Vehicle[]>('vehicles', () => [])

  async function load() {
    if (!userId.value) {
      vehicles.value = []
      return vehicles.value
    }
    const { data } = await db.from('vehicles').select('*')
      .eq('owner_id', userId.value).eq('status', 'active').order('created_at')
    vehicles.value = data ?? []
    return vehicles.value
  }

  async function save(payload: UpsertVehiclePayload) {
    const id = await rpc('upsert_vehicle', { payload: payload as never })
    await load()
    return id
  }

  async function remove(id: string) {
    await rpc('upsert_vehicle', { payload: { id, status: 'removed' } as never })
    await load()
  }

  return { vehicles, load, save, remove }
}
