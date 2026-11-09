import type { Database } from '~~/types/database';


type Fn = Database['public']['Functions'];
type FnName = keyof Fn;
type Args<N extends FnName> = Fn[N]['Args'];
type Returns<N extends FnName> = Fn[N]['Returns'];

// Every write goes through here: unwraps PostgrestError into BoleiaError so screens only see codes.
// jsonb results are typed by the caller: rpc<CancelQuote>('cancel_quote', { booking_id }).
export function useRpc() {
  const db = useDb();

  async function rpc<T = never, N extends FnName = FnName>(
    name: N,
    args: Args<N>,
  ): Promise<[T] extends [never] ? Returns<N> : T> {
    const { data, error } = await db.rpc(name, args as never);

    if (error) {
      throw await toBoleiaError(error);
    }

    return data as never;
  }

  async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.functions.invoke<T>(name, { body });

    if (error) {
      throw await toBoleiaError(error);
    }

    return data as T;
  }

  return { rpc, invoke };
}
