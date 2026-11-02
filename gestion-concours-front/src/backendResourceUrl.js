const LOCAL_BACKEND_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1):(?:8080|8081)(?=\/|[?#]|$)/i;

export function toBackendResourceUrl(value) {
  if (!value) return '';

  const url = String(value);
  if (!LOCAL_BACKEND_ORIGIN.test(url)) return url;

  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return url;
  }
}
