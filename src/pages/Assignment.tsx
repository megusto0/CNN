import { useState, useCallback } from "react";
import PageHeader from "../components/layout/PageHeader";

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }, [code]);

  return (
    <div className="mb-6">
      <p
        className="text-sm font-medium mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>
      <div
        className="relative"
        style={{
          background: "var(--bg-sunken)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "0.5rem",
        }}
      >
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded transition-colors"
          style={{
            background: "var(--bg-raised)",
            color: copied ? "var(--positive)" : "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            cursor: "pointer",
          }}
        >
          {copied ? "скопировано" : "скопировать"}
        </button>
        <pre
          className="font-mono text-sm overflow-x-auto p-4"
          style={{ color: "var(--text-primary)" }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

const CODE_SCRATCH = `# === CNN с нуля ===
import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256), nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))`;

const CODE_EXTRACTOR = `# === Feature extractor ===
from torchvision import models
import torch.nn as nn

model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

for param in model.parameters():
    param.requires_grad = False

model.fc = nn.Linear(model.fc.in_features, 10)`;

const CODE_FINETUNE = `# === Fine-tuning ===
from torchvision import models
import torch.nn as nn

model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

for param in model.parameters():
    param.requires_grad = False

for param in model.layer4.parameters():
    param.requires_grad = True

model.fc = nn.Linear(model.fc.in_features, 10)

optimizer = torch.optim.Adam([
    {"params": model.layer4.parameters(), "lr": 1e-4},
    {"params": model.fc.parameters(), "lr": 1e-3},
])`;

const controlQuestions = [
  "Что такое свёртка и как ядро формирует карту признаков?",
  "Как stride и padding влияют на размер выхода? Напишите формулу.",
  "В чём разница между max-pooling и average-pooling?",
  "Что такое receptive field и как он растёт с глубиной?",
  "Зачем нужна нормализация ImageNet mean/std?",
  "Объясните разницу между feature extractor и fine-tuning.",
  "Почему при fine-tuning используют разные learning rate для разных слоёв?",
  "Сравните ResNet-18 и VGG-16: параметры, глубина, residual connections.",
  "Что такое CAM и чем отличается от Grad-CAM?",
  "Как выбрать метрику для несбалансированных классов?",
];

const reportRequirements = [
  "Постановка задачи и формулы размеров карт признаков",
  "Реализация CNN с нуля (архитектура из методички, обучение на CIFAR-10)",
  "Реализация ResNet-18 как feature extractor (заморозка + новый fc)",
  "Реализация ResNet-18 с fine-tuning (разморозка layer4 + fc, две группы LR)",
  "Графики train/val loss и accuracy для всех трёх моделей",
  "Матрицы ошибок на тестовой выборке (3 штуки)",
  "Сводная таблица: параметры, test acc, время/эпоху, эпох до сходимости",
  "Раздел «что не сработало» с честным разбором ошибок и тупиков",
  "Ответы на 10 контрольных вопросов",
  "Ссылка на репозиторий с кодом, ноутбуками и README",
];

export default function Assignment() {
  return (
    <div>
      <PageHeader title="Задание" />

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Задача
        </h2>
        <p
          className="text-sm max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          Классифицировать изображения CIFAR-10 (10 классов, 32×32 RGB) тремя
          способами: обучить свёрточную сеть с нуля, использовать ResNet-18 как
          feature extractor с замороженными весами и выполнить fine-tuning
          последних слоёв ResNet-18 на целевом датасете — затем сравнить все три
          подхода по точности, скорости обучения и числу параметров.
        </p>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Теоретический минимум
        </h2>
        <ul
          className="list-disc list-inside text-sm space-y-1 max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>
            Свёрточный слой: формула выхода{" "}
            <code
              className="font-mono text-xs px-1 rounded"
              style={{
                background: "var(--bg-sunken)",
                color: "var(--accent)",
              }}
            >
              O = (W − K + 2P) / S + 1
            </code>
          </li>
          <li>
            Пулинг: max-pooling и average-pooling, влияние на пространственные
            размеры
          </li>
          <li>
            Transfer learning: feature extractor (заморозка) и fine-tuning
            (разморозка)
          </li>
          <li>
            Нормализация входа: ImageNet mean/std, зачем и когда нужна
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Постановка эксперимента
        </h2>
        <div
          className="overflow-x-auto mb-6"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "0.5rem",
          }}
        >
          <table
            className="text-sm w-full"
            style={{ color: "var(--text-secondary)" }}
          >
            <thead>
              <tr style={{ background: "var(--bg-sunken)" }}>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Подход
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Архитектура
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Обучаемые параметры
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Особенности
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                  CNN с нуля
                </td>
                <td className="px-4 py-2">SimpleCNN (3 conv + 2 fc)</td>
                <td className="px-4 py-2">Все</td>
                <td className="px-4 py-2">Обучение с нуля на CIFAR-10</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                  Feature extractor
                </td>
                <td className="px-4 py-2">ResNet-18 (pretrained)</td>
                <td className="px-4 py-2">Только fc</td>
                <td className="px-4 py-2">Все веса заморожены</td>
              </tr>
              <tr>
                <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                  Fine-tuning
                </td>
                <td className="px-4 py-2">ResNet-18 (pretrained)</td>
                <td className="px-4 py-2">layer4 + fc</td>
                <td className="px-4 py-2">Разные LR для разных групп</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock code={CODE_SCRATCH} label="CNN с нуля" />
        <CodeBlock code={CODE_EXTRACTOR} label="ResNet-18: feature extractor" />
        <CodeBlock code={CODE_FINETUNE} label="ResNet-18: fine-tuning" />
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Требования к отчёту
        </h2>
        <ol
          className="list-decimal list-inside text-sm space-y-1 max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          {reportRequirements.map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Критерии оценивания
        </h2>
        <ul
          className="list-disc list-inside text-sm space-y-1 max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Код</strong> (30
            %) — корректность реализации, чистота, воспроизводимость
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>
              Метрики и эксперимент
            </strong>{" "}
            (30 %) — полнота сравнения, графики, матрицы ошибок, сводная таблица
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>
              Анализ и «что не сработало»
            </strong>{" "}
            (20 %) — глубина разбора, честность, выводы
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Оформление</strong>{" "}
            (20 %) — структура, наглядность, ответы на контрольные вопросы
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Контрольные вопросы
        </h2>
        <ol
          className="list-decimal list-inside text-sm space-y-1 max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          {controlQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Полезные ссылки
        </h2>
        <ul
          className="list-disc list-inside text-sm space-y-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>
            <a
              href="https://github.com/jeffheaton/t81_558_deep_learning"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              Jeff Heaton — T81-558: Deep Learning Notebooks
            </a>
          </li>
          <li>
            <a
              href="https://pytorch.org/vision/stable/models.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              torchvision — Models and pre-trained weights
            </a>
          </li>
          <li>
            <a
              href="https://www.cs.toronto.edu/~kriz/cifar.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              CIFAR-10 Dataset — Alex Krizhevsky
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
