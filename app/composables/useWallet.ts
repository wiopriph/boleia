import type { Enums, PayoutMethod, Tables, Views } from '~~/types/rpc';


export type WalletSummary = Views<'driver_wallet'>;
export type Payout = Tables<'payouts'>;
type LedgerRow = Pick<Tables<'ledger_entries'>, 'id' | 'amount_kz' | 'memo' | 'booking_id' | 'payout_id' | 'created_at'>;

export interface WalletMovement extends LedgerRow {
  // route of the booking behind the movement, when there is one
  route: string | null
}

export const PAYOUT_MIN_KZ = 5000;

const PAGE_SIZE = 20;

const PAYOUT_STATUS: Record<Enums<'payout_status'>, string> = {
  requested: 'Pedido recebido',
  processing: 'Em processamento',
  paid: 'Pago',
  failed: 'Falhou, valor devolvido à carteira',
  cancelled: 'Cancelado',
};

export function payoutStatusLabel(status: Enums<'payout_status'>): string {
  return PAYOUT_STATUS[status];
}

// the ledger memo carries the operation: release:<booking>, payout:<id>, payout_failed:<id>, ...
export function movementLabel(memo: string | null): string {
  const operation = memo?.split(':')[0];
  const labels: Record<string, string> = {
    release: 'Viagem concluída',
    payout: 'Levantamento pedido',
    payout_failed: 'Levantamento devolvido',
    forfeit: 'Cancelamento tardio de um passageiro',
    refund: 'Reembolso a um passageiro',
  };

  return (operation && labels[operation]) || 'Movimento';
}

export function payoutMethodLabel(method: PayoutMethod | null): string | null {
  if (!method) {
    return null;
  }

  return method.type === 'mcx_express' ? `Multicaixa Express, ${formatPhone(method.phone)}` : `IBAN ${method.iban}, ${method.bank}`;
}

// Driver wallet: every number comes from driver_wallet, ledger_entries and payouts (RLS: own rows).
export function useWallet() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  async function fetchSummary(): Promise<WalletSummary | null> {
    if (!userId.value) {
      return null;
    }

    const { data } = await db.from('driver_wallet').select('*')
      .eq('user_id', userId.value)
      .maybeSingle();

    return data;
  }

  // keyset by id, newest first
  async function fetchMovements(beforeId?: number): Promise<WalletMovement[]> {
    if (!userId.value) {
      return [];
    }

    let query = db.from('ledger_entries')
      .select('id, amount_kz, memo, booking_id, payout_id, created_at')
      .eq('user_id', userId.value)
      .eq('account', 'driver_balance')
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    if (beforeId !== undefined) {
      query = query.lt('id', beforeId);
    }

    const { data } = await query;
    const rows = data ?? [];

    const bookingIds = [...new Set(rows.map(row => row.booking_id).filter((id): id is string => !!id))];
    const routes = new Map<string, string>();

    if (bookingIds.length) {
      const { data: bookings } = await db.from('my_bookings')
        .select('id, origin_name, destination_name, departure_at')
        .in('id', bookingIds);

      for (const booking of bookings ?? []) {
        routes.set(booking.id, `${booking.origin_name} para ${booking.destination_name}, ${formatDay(booking.departure_at)}`);
      }
    }

    return rows.map(row => ({ ...row, route: row.booking_id ? routes.get(row.booking_id) ?? null : null }));
  }

  async function fetchPayouts(): Promise<Payout[]> {
    if (!userId.value) {
      return [];
    }

    const { data } = await db.from('payouts').select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    return data ?? [];
  }

  async function requestPayout(amountKz: number) {
    return rpc('request_payout', { amount_kz: amountKz });
  }

  return { fetchSummary, fetchMovements, fetchPayouts, requestPayout, pageSize: PAGE_SIZE };
}
