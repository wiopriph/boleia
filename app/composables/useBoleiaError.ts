import { FunctionsHttpError } from '@supabase/supabase-js';


export class BoleiaError extends Error {
  code: string | null;

  constructor(code: string | null, cause?: unknown) {
    super(code ? `BOLEIA_${code}` : 'BOLEIA_UNKNOWN', { cause });
    this.name = 'BoleiaError';
    this.code = code;
  }
}

const PREFIX = 'BOLEIA_';

function extractCode(err: unknown): string | null {
  if (err instanceof BoleiaError) {
    return err.code;
  }

  if (typeof err === 'object' && err !== null) {
    const candidate = err as { message?: unknown, code?: unknown, context?: unknown };

    if (typeof candidate.message === 'string' && candidate.message.startsWith(PREFIX)) {
      return candidate.message.slice(PREFIX.length);
    }

    if (typeof candidate.code === 'string' && candidate.code in BOLEIA_ERRORS) {
      return candidate.code;
    }
  }

  return null;
}

// Edge functions answer 4xx with { code } in the body; supabase-js wraps it in FunctionsHttpError.
async function extractFunctionCode(err: unknown): Promise<string | null> {
  if (!(err instanceof FunctionsHttpError)) {
    return null;
  }

  try {
    const body = await err.context.json() as { code?: string };

    return body.code ?? null;
  } catch {
    return null;
  }
}

export async function toBoleiaError(err: unknown): Promise<BoleiaError> {
  if (err instanceof BoleiaError) {
    return err;
  }

  const code = extractCode(err) ?? await extractFunctionCode(err);

  return new BoleiaError(code, err);
}

export function useBoleiaError() {
  const toast = useToast();

  function messageFor(err: unknown): string {
    if (err instanceof BoleiaError) {
      return errorText(err.code);
    }

    if (import.meta.client && typeof navigator !== 'undefined' && !navigator.onLine) {
      return OFFLINE_ERROR;
    }

    return errorText(extractCode(err));
  }

  async function toastError(err: unknown) {
    const error = await toBoleiaError(err);

    if (import.meta.dev && !error.code) {
      console.error(error.cause ?? error);
    }

    toast.add({
      title: errorText(error.code),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  }

  return { messageFor, toastError };
}
