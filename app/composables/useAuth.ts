// Phone + OTP only. GoTrue takes the number without "+": 244900000005.
export function useAuth() {
  const db = useDb();
  const user = useSupabaseUser();

  async function sendCode(localPhone: string) {
    const { error } = await db.auth.signInWithOtp({ phone: toAuthPhone(localPhone) });

    if (error) {
      throw new BoleiaError(error.status === 429 ? 'RATE_LIMITED' : 'OTP_SEND_FAILED', error);
    }
  }

  async function verifyCode(localPhone: string, token: string) {
    const { data, error } = await db.auth.verifyOtp({
      phone: toAuthPhone(localPhone),
      token,
      type: 'sms',
    });

    if (error) {
      throw new BoleiaError(error.status === 429 ? 'RATE_LIMITED' : 'OTP_INVALID', error);
    }

    // the reactive user updates a tick later; callers that need the id right away take it from here
    return data.user;
  }

  async function signOut() {
    await db.auth.signOut();
    await navigateTo('/');
  }

  return {
    user,
    sendCode,
    verifyCode,
    signOut,
  };
}
