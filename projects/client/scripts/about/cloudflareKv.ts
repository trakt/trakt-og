interface CloudflareKvParams {
  readonly accountId: string;
  readonly namespaceId: string;
  readonly token: string;
}

interface Kv {
  /** The parsed JSON value, or null when the key doesn't exist. Throws on any other failure. */
  readonly get: (key: string) => Promise<unknown>;
  readonly put: (key: string, value: unknown) => Promise<void>;
}

/** Reads and writes JSON values in a Workers KV namespace through the Cloudflare REST API. */
export function cloudflareKv({ accountId, namespaceId, token }: CloudflareKvParams): Kv {
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values`;
  const headers = { authorization: `Bearer ${token}` };
  const url = (key: string) => `${base}/${encodeURIComponent(key)}`;

  return {
    get: async (key) => {
      const response = await fetch(url(key), { headers });
      if (response.status === 404) {
        await response.body?.cancel();
        return null;
      }
      if (!response.ok) throw new Error(`KV answered ${response.status} reading ${key}`);
      return response.json();
    },
    put: async (key, value) => {
      const response = await fetch(url(key), {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/octet-stream' },
        body: JSON.stringify(value),
      });
      await response.body?.cancel();
      if (!response.ok) throw new Error(`KV answered ${response.status} writing ${key}`);
    },
  };
}
