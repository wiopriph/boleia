import type { Tables } from '~~/types/rpc';


export type OwnReview = Tables<'reviews'>;

export function useReviews() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  async function submitReview(bookingId: string, rating: number, tags: string[], comment?: string) {
    return rpc('submit_review', { booking_id: bookingId, rating, tags, comment });
  }

  // an author always sees their own review, even before it becomes public
  async function fetchOwnReview(bookingId: string): Promise<OwnReview | null> {
    if (!userId.value) {
      return null;
    }

    const { data } = await db.from('reviews').select('*')
      .eq('booking_id', bookingId)
      .eq('author_id', userId.value)
      .maybeSingle();

    return data;
  }

  return { submitReview, fetchOwnReview };
}
