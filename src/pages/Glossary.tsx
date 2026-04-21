import { Link } from "react-router-dom";

const terms = [
  ["CNN", "Свёрточная нейронная сеть: слои Conv/ReLU/Pooling извлекают пространственные признаки, классификатор принимает решение."],
  ["Feature map", "Карта ответов одного фильтра на всех позициях входа."],
  ["Kernel", "Маленькая матрица весов, которая скользит по входу при свёртке."],
  ["Padding", "Дополнительные пиксели по краям входа, обычно нули, чтобы управлять размером выхода."],
  ["Stride", "Шаг, с которым окно свёртки или pooling перемещается по входу."],
  ["Feature extractor", "Режим transfer learning, где backbone заморожен, а обучается только новая голова."],
  ["Fine-tuning", "Режим, где часть предобученной сети размораживается и дообучается под новую задачу."],
  ["CAM", "Class Activation Map: тепловая карта, показывающая, какие области последнего conv слоя поддержали выбранный класс."],
];

export default function Glossary() {
  return (
    <main className="min-h-dvh px-4 py-8 lg:px-10" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="mx-auto max-w-3xl">
        <Link to="/1" className="text-sm" style={{ color: "var(--accent)" }}>← к лабораторной</Link>
        <h1 className="mt-6 text-3xl font-semibold">Глоссарий</h1>
        <div className="mt-6 grid gap-3">
          {terms.map(([term, definition]) => (
            <article
              key={term}
              className="rounded-md border p-4"
              style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
            >
              <h2 className="font-mono text-sm" style={{ color: "var(--accent)" }}>{term}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{definition}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
