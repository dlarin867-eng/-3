// Блок 5 — "Обработка ошибок и таймаутов внешних API (fallback на ручной
// ввод)". Общий wrapper для Open Food Facts/USDA — Claude SDK таймаутит
// самостоятельно (см. claude-vision.ts).

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
}

/**
 * fetch + JSON с таймаутом и одним повтором. Бросает ExternalApiError вместо
 * того, чтобы дать сырому TypeError/AbortError утечь наружу — вызывающий код
 * (роут) ловит именно этот тип и переключается на fallback (ручной ввод).
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 5000, retries = 1 } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new ExternalApiError(`${url} ответил ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ExternalApiError(`Не удалось получить ответ от ${url} после ${retries + 1} попыток`, lastError);
}
