declare module 'cloudflare:workers' {
  export const env: {
    /** Klipy's API key, a Worker secret. Unset, comments can't pick GIFs. */
    KLIPY_API_KEY?: string;
    /** A read-only GitHub token, a Worker secret, for the about page's GitHub reads. Unset, it reads without one. */
    GITHUB_TOKEN?: string;
    /** The live page's refresher, a Durable Object. Unset under `vite dev`, which can't run one. */
    WATCHING_NOW_LIVE?: DurableObjectNamespace;
  };
  export function waitUntil(promise: Promise<unknown>): void;
  /** A Durable Object's base class: the runtime hands it its state and the Worker's env. */
  export abstract class DurableObject<Env = unknown> {
    protected readonly ctx: DurableObjectState;
    protected readonly env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
}

interface CacheStorage {
  /** The data center's cache. */
  readonly default: import('./lib/settings/keptSettingsFetch.ts').ResponseCache;
}

/** The parts of Cloudflare's Durable Object API the live page's refresher uses. */
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectState {
  acceptWebSocket(socket: WebSocket): void;
  getWebSockets(): WebSocket[];
  readonly storage: {
    get<T>(key: string): Promise<T | undefined>;
    put(key: string, value: unknown): Promise<void>;
    getAlarm(): Promise<number | null>;
    setAlarm(at: number): Promise<void>;
  };
}

/** A Worker's pair of joined sockets: it answers with the first and keeps the second. */
declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

interface ResponseInit {
  /** The client end of a `WebSocketPair`, on a 101 that accepts a socket. */
  webSocket?: WebSocket | null;
}
