// Saferpay JSON API client (server-side only).
// Docs: https://saferpay.github.io/jsonapi/

export const SAFERPAY_SPEC_VERSION = '1.48';

type SaferpayConfig = {
  customerId: string;
  terminalId: string;
  apiUsername: string;
  apiPassword: string;
  baseUrl: string;
};

export function getSaferpayConfig(): SaferpayConfig {
  const customerId = process.env.SAFERPAY_CUSTOMER_ID;
  const terminalId = process.env.SAFERPAY_TERMINAL_ID;
  const apiUsername = process.env.SAFERPAY_API_USERNAME;
  const apiPassword = process.env.SAFERPAY_API_PASSWORD;
  const baseUrl = (
    process.env.SAFERPAY_BASE_URL ?? 'https://test.saferpay.com/api'
  ).replace(/\/$/, '');

  if (!customerId || !terminalId || !apiUsername || !apiPassword) {
    throw new Error(
      'Nedostaju Saferpay env varijable. Potrebno: SAFERPAY_CUSTOMER_ID, ' +
        'SAFERPAY_TERMINAL_ID, SAFERPAY_API_USERNAME, SAFERPAY_API_PASSWORD.',
    );
  }

  return { customerId, terminalId, apiUsername, apiPassword, baseUrl };
}

export function isSaferpayConfigured(): boolean {
  return Boolean(
    process.env.SAFERPAY_CUSTOMER_ID &&
      process.env.SAFERPAY_TERMINAL_ID &&
      process.env.SAFERPAY_API_USERNAME &&
      process.env.SAFERPAY_API_PASSWORD,
  );
}

export type SaferpayErrorBody = {
  ErrorName?: string;
  ErrorMessage?: string;
  Behavior?: string;
  TransactionId?: string;
  OrderId?: string;
  ErrorDetail?: string[];
};

export class SaferpayApiError extends Error {
  status: number;
  body: SaferpayErrorBody | null;

  constructor(status: number, body: SaferpayErrorBody | null, fallback: string) {
    super(body?.ErrorMessage ?? body?.ErrorName ?? fallback);
    this.name = 'SaferpayApiError';
    this.status = status;
    this.body = body;
  }
}

function buildRequestHeader(customerId: string) {
  return {
    SpecVersion: SAFERPAY_SPEC_VERSION,
    CustomerId: customerId,
    RequestId: crypto.randomUUID(),
    RetryIndicator: 0,
    ClientInfo: {
      ShopInfo: 'Ginko Sobe',
      OsInfo: 'Node.js',
    },
  };
}

export async function saferpayRequest<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const config = getSaferpayConfig();
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const payload = {
    RequestHeader: buildRequestHeader(config.customerId),
    ...body,
  };

  const auth = Buffer.from(
    `${config.apiUsername}:${config.apiPassword}`,
  ).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new SaferpayApiError(
      res.status,
      (json as SaferpayErrorBody) ?? null,
      `Saferpay ${path} failed (${res.status})`,
    );
  }

  return json as TResponse;
}

// ── Response types (subset we use) ────────────────────────────────

export type SaferpayAmount = {
  Value: string;
  CurrencyCode: string;
};

export type SaferpayTransaction = {
  Type?: string;
  Status?: string;
  Id?: string;
  Date?: string;
  Amount?: SaferpayAmount;
  OrderId?: string;
  CaptureId?: string;
  SixTransactionReference?: string;
  ApprovalCode?: string;
};

export type PaymentPageInitializeResponse = {
  Token: string;
  RedirectUrl: string;
  Expiration?: string;
};

export type PaymentPageAssertResponse = {
  Transaction: SaferpayTransaction;
  PaymentMeans?: {
    Brand?: { PaymentMethod?: string; Name?: string };
    DisplayText?: string;
  };
  Liability?: {
    LiabilityShift?: boolean;
    LiableEntity?: string;
  };
};

export type TransactionCaptureResponse = {
  CaptureId?: string;
  Status?: string;
  Date?: string;
};

export type TransactionRefundResponse = {
  Transaction: SaferpayTransaction;
  CaptureId?: string;
};
