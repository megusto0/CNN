import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, Boxes } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const cards = [
  {
    to: "/theory",
    icon: BookOpen,
    title: "Теория",
    description:
      "Интерактивные объяснения: свёртка, пулинг, transfer learning, препроцессинг.",
  },
  {
    to: "/assignment",
    icon: ClipboardList,
    title: "Задание",
    description:
      "Полная постановка эксперимента, код для CoLab, критерии оценивания.",
  },
  {
    to: "/playground",
    icon: Boxes,
    title: "Песочница",
    description:
      "Потрогать свёртку руками, ResNet-50 в браузере, обучение CNN онлайн.",
  },
];

const insideItems = [
  "Интерактивная свёртка — потрогать ядро и увидеть эффект.",
  "ResNet-50 в браузере — классификация и CAM-карта внимания.",
  "Обучение CNN онлайн — мини-демо цикла обучения на MNIST.",
  "Сравнение архитектур — LeNet, AlexNet, VGG-16, ResNet-18.",
  "Чеклист отчёта — самопроверка перед сдачей.",
];

const sources = [
  {
    label: "Heaton 05_2: CNN",
    href: "https://raw.githubusercontent.com/jeffheaton/t81_558_deep_learning/master/t81_558_class_05_2_cnn.ipynb",
  },
  {
    label: "Heaton 05_3: transfer learning",
    href: "https://raw.githubusercontent.com/jeffheaton/t81_558_deep_learning/master/t81_558_class_05_3_vision_transfer.ipynb",
  },
  {
    label: "torchvision.models docs",
    href: "https://pytorch.org/vision/stable/models.html",
  },
];

export default function Overview() {
  return (
    <div>
      <PageHeader
        title="Лабораторная №N"
        subtitle="Свёрточные нейронные сети"
      />

      <p
        className="text-sm max-w-prose mb-10"
        style={{ color: "var(--text-secondary)" }}
      >
        Классификация CIFAR-10 тремя способами: CNN с нуля, ResNet-18 как feature
        extractor, ResNet-18 с fine-tuning. Стенд заменяет PDF-методичку.
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
          Что внутри
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {insideItems.map((item) => (
            <li
              key={item}
              style={{ color: "var(--text-secondary)" }}
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Источники
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {sources.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                {s.label}
              </a>
            </li>
          ))}
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
          Браузер с WASM SIMD. Первая загрузка модели — ~60 МБ, кэшируется.
        </p>
      </section>
    </div>
  );
}
