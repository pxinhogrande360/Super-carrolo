const REMOTE_SERVER_ORIGIN =
  import.meta.env.VITE_PUBLIC_SERVER_URL ||
  'https://ais-pre-w7iwtae25rp6sawx3za32f-246609707240.europe-west2.run.app';

export function isNativeApp(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function apiUrl(path: string): string {
  if (!isNativeApp()) return path;
  return `${REMOTE_SERVER_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export function wsUrl(path: string): string {
  if (!isNativeApp()) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}${path}`;
  }
  const url = new URL(REMOTE_SERVER_ORIGIN);
  const proto = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${url.host}${path}`;
}
