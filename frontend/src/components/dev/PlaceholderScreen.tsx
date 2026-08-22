// Честная заглушка: блок 7 — это каркас и роутинг, а не готовые экраны.
// Полное содержание каждого экрана — блок 8 задачника. Оставлено намеренно
// пустым, а не "красиво имитированным", чтобы не выдать черновик за готовое.
export function PlaceholderScreen({ title, spec }: { title: string; spec: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {title && <h1 style={{ font: "var(--text-heading-l)" }}>{title}</h1>}
      <p style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        Экран продукта — содержание по спецификации ({spec}) добавляется в блоке 8 задачника. Маршрут, тема и
        таб-бар уже рабочие.
      </p>
    </div>
  );
}
