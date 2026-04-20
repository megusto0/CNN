import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import ConvTheory from "../content/conv";
import PoolingTheory from "../content/pooling";
import TransferTheory from "../content/transfer";
import PreprocessingTheory from "../content/preprocessing";
import ReceptiveFieldTheory from "../content/receptive-field";

const topics = [
  {
    slug: "conv",
    title: "Свёрточный слой",
    description:
      "Ядро, stride, padding, receptive field, формула размера выхода.",
  },
  {
    slug: "pooling",
    title: "Пулинг",
    description:
      "Max vs average, почему у max-pool нет весов, связь с переобучением.",
  },
  {
    slug: "transfer",
    title: "Transfer learning",
    description:
      "Feature extractor и fine-tuning: два режима, когда какой выбирать.",
  },
  {
    slug: "preprocessing",
    title: "Препроцессинг",
    description:
      "Почему Normalize именно со статистикой ImageNet и что будет, если её не делать.",
  },
  {
    slug: "receptive-field",
    title: "Receptive field",
    description:
      "Как растёт область влияния нейрона с глубиной сети.",
  },
];

import type { JSX } from "react";

const contentMap: Record<string, () => JSX.Element> = {
  conv: ConvTheory,
  pooling: PoolingTheory,
  transfer: TransferTheory,
  preprocessing: PreprocessingTheory,
  "receptive-field": ReceptiveFieldTheory,
};

export default function Theory() {
  const { topic } = useParams();

  if (topic) {
    const found = topics.find((t) => t.slug === topic);
    const Content = contentMap[topic];
    return (
      <div>
        <PageHeader title={found?.title ?? topic} />
        {Content ? <Content /> : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Содержимое раздела «{found?.title}» не найдено.
          </p>
        )}
        <Link
          to="/theory"
          className="inline-block mt-6 text-sm"
          style={{ color: "var(--accent)" }}
        >
          ← Назад к списку тем
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Теория" />
      <p
        className="text-sm max-w-prose mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        Пять коротких тем. Каждая — с интерактивом, а не стеной текста.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/theory/${t.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-md border transition-colors"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t.title}
            </h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
