/**
 * Sigurno formatiranje grešaka za webhook / logove.
 * Bez API lozinki, tokena, kartičnih podataka i PII gostiju.
 */

const REDACT_VALUE =
  /(password|secret|token|authorization|bearer\s+\S+|api[_-]?key)\s*[:=]\s*\S+/gi;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function redact(text: string): string {
  return text.replace(REDACT_VALUE, '$1=[REDACTED]').slice(0, 500);
}

function collectSafeParts(obj: Record<string, unknown>): string[] {
  const parts: string[] = [];
  const code = obj.code ?? obj.ErrorName;
  const message = obj.message ?? obj.ErrorMessage ?? obj.details ?? obj.hint;
  if (typeof code === 'string' && code.trim()) parts.push(`code=${code.trim()}`);
  if (typeof code === 'number') parts.push(`code=${code}`);
  if (typeof message === 'string' && message.trim()) {
    parts.push(message.trim().slice(0, 300));
  }
  if (typeof obj.status === 'number') parts.push(`status=${obj.status}`);
  if (typeof obj.name === 'string' && obj.name !== 'Error') {
    parts.push(`name=${obj.name}`);
  }
  return parts;
}

/**
 * Pretvori bilo koji thrown value u čitljiv string za DB/log.
 * Nikad ne vraća "[object Object]".
 */
export function formatSafeErrorMessage(err: unknown): string {
  if (err == null) return 'unknown_error';

  if (typeof err === 'string') {
    return redact(err);
  }

  if (err instanceof Error) {
    const asObj = err as unknown as Record<string, unknown>;
    const parts = collectSafeParts({
      ...asObj,
      message: err.message,
      name: err.name,
    });
    if (parts.length === 0) {
      return redact(err.message || err.name || 'Error');
    }
    return redact([...new Set(parts)].join(' | '));
  }

  if (isPlainObject(err)) {
    const parts = collectSafeParts(err);
    if (parts.length > 0) return redact([...new Set(parts)].join(' | '));
    try {
      return redact(JSON.stringify(err));
    } catch {
      return 'non_serializable_error';
    }
  }

  return redact(String(err));
}
