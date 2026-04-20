import { Link } from "react-router-dom";

export default function TransferTheory() {
  return (
    <article className="max-w-prose text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      <p className="mb-4">
        Transfer learning — подход, при котором модель, обученная на одном датасете
        (обычно ImageNet), используется как отправная точка для другой задачи.
        Это особенно эффективно, когда целевой датасет мал.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Feature extractor
      </h2>
      <p className="mb-4">
        Все веса предобученной модели замораживаются. Выход последнего свёрточного блока
        (или global average pooling) подаётся на новый полносвязный классификатор,
        который обучается с нуля. Подходит, когда целевой датасет мал и похож на ImageNet.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Fine-tuning
      </h2>
      <p className="mb-4">
        После обучения классификатора несколько последних слоёв backbone «размораживаются»
        и дообучаются с маленьким learning rate (обычно в 10–100 раз меньше, чем для
        классификатора). Позволяет адаптировать высокоуровневые признаки к новому домену.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Когда какой подход выбирать
      </h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>Малый датасет + похожий домен → feature extractor</li>
        <li>Малый датасет + другой домен → feature extractor с ранних слоёв + fine-tuning последних</li>
        <li>Большой датасет → полный fine-tuning с маленьким LR</li>
      </ul>

      <div
        className="p-4 rounded-md border mt-6"
        style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          Интерактивный демонстратор
        </p>
        <Link
          to="/transfer"
          className="text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          Попробовать ResNet-50 в браузере →
        </Link>
      </div>
    </article>
  );
}
