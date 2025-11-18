/**
 * Realiza un fetch con reintentos automáticos ante errores de red o timeout.
 * @param url URL a la que se hace fetch
 * @param options Opciones de fetch estándar
 * @param retries Número de reintentos (por defecto 2, total 3 intentos)
 * @param retryDelayMs Milisegundos a esperar entre reintentos (por defecto 500ms)
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  retryDelayMs = 500
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (i === retries) break;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw lastError;
}
