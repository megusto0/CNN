import { Link } from "react-router-dom";

export default function ConvTheory() {
  return (
    <article className="max-w-prose text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      <p className="mb-4">
        Свёрточный слой — основной строительный блок CNN. Он применяет набор обучаемых фильтров (ядер)
        к входному изображению или карте признаков, создавая на выходе новую карту признаков.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Как работает свёртка
      </h2>
      <p className="mb-4">
        Ядро размером K×K «скользит» по входу с шагом stride (S). На каждой позиции
        выполняется поэлементное умножение значений ядра на соответствующий фрагмент входа,
        а результаты суммируются. Полученное число — значение одного пикселя выходной карты признаков.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Формула размера выхода
      </h2>
      <p className="mb-2">
        Для входа размером W×H с ядром K×K, stride S и padding P:
      </p>
      <div
        className="p-3 rounded-md mb-4 font-mono text-center text-sm"
        style={{ backgroundColor: "var(--bg-sunken)", color: "var(--accent)" }}
      >
        W_out = ⌊(W − K + 2P) / S⌋ + 1
      </div>
      <p className="mb-4">
        Если P=0 (valid padding), карта признаков уменьшается. При P = (K−1)/2 и S=1
        размер выхода совпадает с входом (same padding).
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Receptive field
      </h2>
      <p className="mb-4">
        Каждое значение в выходной карте зависит от области входа размером K×K — это receptive field
        данного нейрона. С увеличением глубины сети receptive field растёт, позволяя нейронам
        «видеть» всё более крупные участки изображения.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Количество параметров
      </h2>
      <p className="mb-4">
        Свёрточный слой с C_in входными каналами, C_out выходными каналами и ядром K×K
        содержит C_out × (C_in × K × K + 1) параметров (включая bias).
        Это существенно меньше, чем у полносвязного слоя.
      </p>

      <div
        className="p-4 rounded-md border mt-6"
        style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
          Интерактивный демонстратор
        </p>
        <Link
          to="/playground"
          className="text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          Открыть песочницу со свёрткой →
        </Link>
      </div>
    </article>
  );
}
