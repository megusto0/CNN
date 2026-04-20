import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, Boxes } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const cards = [
  {
    to: "/theory",
    icon: BookOpen,
    title: "Теория",
    description:
      "Свёрточные слои, пулинг, transfer learning, препроцессинг, receptive field — с интерактивом.",
  },
  {
    to: "/assignment",
    icon: ClipboardList,
    title: "Задание",
    description:
      "Постановка задачи, 16 вариантов (dataset × backbone), требования к отчёту, контрольные вопросы.",
  },
  {
    to: "/playground",
    icon: Boxes,
    title: "Песочница",
    description:
      "Интерактивные демонстраторы: свёртка на изображениях, пулинг, архитектуры CNN.",
  },
];

export default function Overview() {
  return (
    <div>
      <PageHeader
        title="Лабораторная №N. Свёрточные нейронные сети"
        subtitle="Классификация изображений: собственная CNN и перенос обучения"
      />

      <p
        className="text-sm max-w-prose mb-10"
        style={{ color: "var(--text-secondary)" }}
      >
        Работа покрывает два сюжета: построение свёрточной сети с нуля на PyTorch
        и использование предобученных моделей из torchvision.models. Стенд заменяет
        PDF-методичку: здесь вы получаете вариант, читаете теорию, запускаете
        интерактивные демонстраторы и проверяете готовность отчёта.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group flex flex-col gap-3 p-5 rounded-md border transition-colors"
              style={{
                backgroundColor: "var(--bg-raised)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                style={{ color: "var(--accent)" }}
              />
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {card.title}
              </h2>
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.description}
              </p>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent)" }}
              >
                Перейти →
              </span>
            </Link>
          );
        })}
      </div>

      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Источники
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            <a
              href="https://raw.githubusercontent.com/jeffheaton/t81_558_deep_learning/master/t81_558_class_05_2_cnn.ipynb"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              Heaton — CNN from scratch (05_2)
            </a>
          </li>
          <li>
            <a
              href="https://raw.githubusercontent.com/jeffheaton/t81_558_deep_learning/master/t81_558_class_05_3_vision_transfer.ipynb"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              Heaton — Transfer learning (05_3)
            </a>
          </li>
          <li>
            <a
              href="https://pytorch.org/vision/stable/models.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              torchvision.models — документация
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Технические требования
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Браузер с поддержкой WebAssembly SIMD. Для демонстрации с ResNet
          потребуется ~30 МБ на загрузку модели (кэшируется).
        </p>
      </section>
    </div>
  );
}
