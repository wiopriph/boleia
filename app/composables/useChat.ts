export function useChat() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  // First message from the trip page: send_message creates the conversation (passenger, trip) and
  // returns the message id, so the conversation is looked up afterwards for the redirect.
  async function askDriver(tripId: string, body: string): Promise<string | null> {
    await rpc('send_message', { body, trip_id: tripId });

    if (!userId.value) {
      return null;
    }

    const { data } = await db.from('my_conversations')
      .select('id')
      .eq('trip_id', tripId)
      .eq('passenger_id', userId.value)
      .maybeSingle();

    return data?.id ?? null;
  }

  return { askDriver };
}
