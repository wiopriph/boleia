import type { PaymentsInitResult, PaymentsStatusResult } from '~~/types/rpc';


export type SimulateMode = 'paid' | 'failed' | 'mismatch' | 'silent' | 'qr' | 'redirect';

// payments-init is idempotent for a pending payment (returns the same instructions with `already`),
// so the page can call it on every open. `simulate` only reaches the mock gateway in dev.
export function usePayment() {
  const { invoke } = useRpc();

  async function init(bookingId: string, simulate?: SimulateMode) {
    const body: Record<string, unknown> = { booking_id: bookingId };

    if (import.meta.dev && simulate) {
      body.simulate = simulate;
    }

    return invoke<PaymentsInitResult>('payments-init', body);
  }

  async function status(paymentId: string) {
    return invoke<PaymentsStatusResult>('payments-status', { payment_id: paymentId });
  }

  return { init, status };
}
