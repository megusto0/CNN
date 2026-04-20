import { Link } from "react-router-dom";

export default function PoolingTheory() {
  return (
    <article className="max-w-prose text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      <p className="mb-4">
        Пулинг (subsampling) уменьшает пространственный размер карты признаков,
        снижая число параметров и вычислений в последующих слоях. Два основных типа: max-pooling
        и average-pooling.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Max-pooling
      </h2>
      <p className="mb-4">
        В каждом окне K×K выбирается максимальное значение. Max-pooling сохраняет наиболее
        выраженные признаки и обеспечивает небольшую трансляционную инвариантность.
        У этой операции нет обучаемых параметров.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Average-pooling
      </h2>
      <p className="mb-4">
        Вычисляет среднее арифметическое значений в окне. Часто используется в последнем
        слое (global average pooling), заменяя полносвязный классификатор и уменьшая
        число параметров.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Связь с переобучением
      </h2>
      <p className="mb-4">
        Уменьшая пространственное разрешение, пулинг снижает размерность данных, что
        служит формой регуляризации и помогает бороться с переобучением. Современные
        архитектуры (ResNet) часто заменяют pooling увеличением stride в свёрточных слоях.
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
          Открыть визуализатор пулинга →
        </Link>
      </div>
    </article>
  );
}
