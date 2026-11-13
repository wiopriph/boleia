function sendErrorCode(error: { status?: number, code?: string }): string {
  if (error.code === 'captcha_failed') {
    return 'CAPTCHA_FAILED';
  }

  return error.status === 429 ? 'RATE_LIMITED' : 'OTP_SEND_FAILED';
}

// Phone + OTP only. GoTrue takes the number without "+": 244900000005.
export function useAuth() {
  const db = useDb();
  const user = useSupabaseUser();

  // captchaToken: Turnstile token, checked by Supabase Auth when its captcha protection is on
  async function sendCode(localPhone: string, captchaToken?: string) {
    const { error } = await db.auth.signInWithOtp({
      phone: toAuthPhone(localPhone),
      options: { captchaToken },
    });

    if (error) {
      throw new BoleiaError(sendErrorCode(error), error);
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
