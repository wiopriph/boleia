import type { Database } from '~~/types/database';


export function useDb() {
  return useSupabaseClient<Database>();
}
