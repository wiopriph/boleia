import type { Tables, VerificationDocs } from '~~/types/rpc';


export type Verification = Tables<'driver_verifications'>;

const SIGNED_URL_SECONDS = 60 * 60;

// Voluntary driver verification (spec section 8): four documents in the private bucket.
export function useDriverVerification() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  async function fetchLatest(): Promise<Verification | null> {
    if (!userId.value) {
      return null;
    }

    const { data } = await db.from('driver_verifications').select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }

  async function submit(vehicleId: string, docs: VerificationDocs) {
    return rpc('submit_verification', { vehicle_id: vehicleId, doc_urls: docs as never });
  }

  // the bucket is private: previews of the user's own uploads go through short-lived signed URLs
  async function previewUrl(path: string): Promise<string | null> {
    const { data } = await db.storage.from('verifications').createSignedUrl(path, SIGNED_URL_SECONDS);

    return data?.signedUrl ?? null;
  }

  return { fetchLatest, submit, previewUrl };
}
