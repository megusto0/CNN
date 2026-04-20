export default function PreprocessingTheory() {
  return (
    <article className="max-w-prose text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      <p className="mb-4">
        Предобученные модели ожидают вход, нормализованный той же статистикой, что
        использовалась при обучении. Для моделей torchvision это статистика ImageNet:
      </p>

      <div
        className="p-3 rounded-md mb-4 font-mono text-xs"
        style={{ backgroundColor: "var(--bg-sunken)", color: "var(--accent)" }}
      >
        mean = [0.485, 0.456, 0.406]<br />
        std = [0.229, 0.224, 0.225]
      </div>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Почему именно эти числа
      </h2>
      <p className="mb-4">
        Это среднее и стандартное отклонение по каналам RGB, вычисленные на всём ImageNet
        (1.2M изображений). Нормализация приводит входные данные к диапазону,
        на котором модель обучалась.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Что будет без нормализации
      </h2>
      <p className="mb-4">
        Без нормализации распределение входных значений смещено относительно того,
        что ожидает модель. Результат: уверенность модели падает, top-1 accuracy
        может упасть на 10–30 процентных пунктов. Это одна из частых ошибок при работе
        с предобученными моделями.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Типичный пайплайн
      </h2>
      <div
        className="p-3 rounded-md mb-4 font-mono text-xs"
        style={{ backgroundColor: "var(--bg-sunken)", color: "var(--text-secondary)" }}
      >
        transforms.Resize(256)<br />
        transforms.CenterCrop(224)<br />
        transforms.ToTensor()          # [0, 255] → [0, 1]<br />
        transforms.Normalize(mean, std) # → [-2.5, 2.5]
      </div>

      <p className="mb-4">
        Resize + CenterCrop — стандартная стратегия для получения квадратного входа 224×224.
        ToTensor переводит uint8 [0, 255] в float32 [0, 1]. Normalize затем центрирует
        и масштабирует по каждому каналу.
      </p>
    </article>
  );
}
