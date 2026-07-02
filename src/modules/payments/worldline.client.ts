// Singleton server-side Worldline (Online Payments) client.
// Never import this in client components — API keys must stay server-only.

import onlinePaymentsSdk from 'onlinepayments-sdk-nodejs';
import type { Client } from 'onlinepayments-sdk-nodejs';

type WebhooksHelper = ReturnType<typeof onlinePaymentsSdk.webhooks.init>;

type WorldlineConfig = {
  apiKeyId: string;
  secretApiKey: string;
  merchantId: string;
  host: string;
};

function getWorldlineConfig(): WorldlineConfig {
  const apiKeyId = process.env.WORLDLINE_API_KEY_ID;
  const secretApiKey = process.env.WORLDLINE_API_SECRET;
  const merchantId = process.env.WORLDLINE_MERCHANT_ID;
  const host =
    process.env.WORLDLINE_API_HOST ??
    'payment.preprod.direct.worldline-solutions.com';

  if (!apiKeyId || !secretApiKey || !merchantId) {
    throw new Error(
      'Nedostaju Worldline env varijable u .env.local. ' +
        'Potrebno: WORLDLINE_API_KEY_ID, WORLDLINE_API_SECRET, WORLDLINE_MERCHANT_ID.',
    );
  }

  return { apiKeyId, secretApiKey, merchantId, host };
}

let _client: Client | null = null;

export function getWorldlineClient(): Client {
  if (!_client) {
    const { apiKeyId, secretApiKey, host } = getWorldlineConfig();
    _client = onlinePaymentsSdk.init({
      integrator: 'Ginko Sobe',
      host,
      scheme: 'https',
      port: 443,
      enableLogging: process.env.NODE_ENV === 'development',
      apiKeyId,
      secretApiKey,
    });
  }
  return _client;
}

export function getWorldlineMerchantId(): string {
  return getWorldlineConfig().merchantId;
}

// ── Webhooks helper ───────────────────────────────────────────────

let _webhooksHelper: WebhooksHelper | null = null;

export function getWorldlineWebhooksHelper(): WebhooksHelper {
  if (_webhooksHelper) return _webhooksHelper;

  const keyId = process.env.WORLDLINE_WEBHOOK_KEY_ID;
  const secretKey = process.env.WORLDLINE_WEBHOOK_SECRET;

  if (!keyId || !secretKey) {
    throw new Error(
      'Nedostaju WORLDLINE_WEBHOOK_KEY_ID / WORLDLINE_WEBHOOK_SECRET u .env.local.',
    );
  }

  onlinePaymentsSdk.webhooks.inMemorySecretKeyStore.storeSecretKey(keyId, secretKey);
  _webhooksHelper = onlinePaymentsSdk.webhooks.init(
    onlinePaymentsSdk.webhooks.inMemorySecretKeyStore,
  );

  return _webhooksHelper;
}
