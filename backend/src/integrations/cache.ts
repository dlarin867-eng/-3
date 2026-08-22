// Блок 5 — "Кэширование частых запросов к базам нутриентов". In-memory TTL
// кэш — сознательно без Redis на старте (см. backend-developer.md "Стек":
// "Redis — опционально, можно начать без него"). Один процесс, поэтому
// кэш per-instance — при масштабировании на несколько инстансов вынести в
// Redis, интерфейс (get/set) рассчитан так, чтобы замена не тронула вызывающий код.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  // Generic per call (не привязан к T класса) — так TtlCache<unknown> можно
  // переиспользовать для разных типов данных (штрихкоды, названия продуктов)
  // без каста на каждом вызове get/set по отдельности.
  async wrap<R extends T>(key: string, compute: () => Promise<R>): Promise<R> {
    const cached = this.get(key) as R | undefined;
    if (cached !== undefined) return cached;
    const value = await compute();
    this.set(key, value);
    return value;
  }
}

// Штрихкоды и названия продуктов почти не меняются день ото дня — 24ч TTL
// разумен и заметно снижает нагрузку на Open Food Facts/USDA при повторных
// сканированиях одного и того же продукта разными пользователями.
export const nutrientCache = new TtlCache<unknown>(24 * 60 * 60 * 1000);
