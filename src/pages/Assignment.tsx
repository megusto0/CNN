import PageHeader from "../components/layout/PageHeader";
import VariantAssigner from "../features/variant-assigner/VariantAssigner";

const variants = [
  { n: 1, dataset: "CIFAR-10", backbone: "resnet18" },
  { n: 2, dataset: "CIFAR-10", backbone: "mobilenet_v3_small" },
  { n: 3, dataset: "CIFAR-10", backbone: "efficientnet_b0" },
  { n: 4, dataset: "FashionMNIST", backbone: "resnet18" },
  { n: 5, dataset: "FashionMNIST", backbone: "vgg16_bn" },
  { n: 6, dataset: "FashionMNIST", backbone: "densenet121" },
  { n: 7, dataset: "Oxford-IIIT Pet", backbone: "resnet50" },
  { n: 8, dataset: "Oxford-IIIT Pet", backbone: "mobilenet_v3_small" },
  { n: 9, dataset: "Oxford-IIIT Pet", backbone: "efficientnet_b0" },
  { n: 10, dataset: "Flowers102", backbone: "resnet50" },
  { n: 11, dataset: "Flowers102", backbone: "vgg16_bn" },
  { n: 12, dataset: "Flowers102", backbone: "densenet121" },
  { n: 13, dataset: "Food101 (subset)", backbone: "resnet50" },
  { n: 14, dataset: "Food101 (subset)", backbone: "efficientnet_b0" },
  { n: 15, dataset: "STL-10", backbone: "resnet18" },
  { n: 16, dataset: "STL-10", backbone: "resnet50" },
];

const controlQuestions = [
  "Что такое свёртка и как ядро (kernel) формирует карту признаков?",
  "Как stride и padding влияют на размерность выхода? Напишите формулу.",
  "В чём разница между max-pooling и average-pooling? Когда какой применять?",
  "Что такое receptive field нейрона и как он растёт с глубиной сети?",
  "Зачем нужна нормализация входа (ImageNet mean/std)? Что будет без неё?",
  "Объясните разницу между feature extractor и fine-tuning подходами transfer learning.",
  "Какие слои замораживаются при fine-tuning и почему не все сразу?",
  "Сравните ResNet-50 и VGG-16: число параметров, глубина, наличие residual connections.",
  "Что такое Class Activation Map (CAM) и чем отличается от Grad-CAM?",
  "Как выбрать метрику качества для задачи классификации с несбалансированными классами?",
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
          Цель
        </h2>
        <p className="text-sm max-w-prose" style={{ color: "var(--text-secondary)" }}>
          Освоить построение свёрточных нейронных сетей на PyTorch: от собственной
          архитектуры до использования предобученных моделей torchvision с transfer
          learning.
        </p>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Теоретический минимум
        </h2>
        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
          <li>Свёрточный слой: ядро, stride, padding, receptive field</li>
          <li>Пулинг: max vs average</li>
          <li>Transfer learning: feature extractor и fine-tuning</li>
          <li>Препроцессинг: нормализация ImageNet</li>
          <li>Receptive field</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Практические задания
        </h2>
        <ol className="list-decimal list-inside text-sm space-y-2 max-w-prose" style={{ color: "var(--text-secondary)" }}>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>CNN с нуля.</strong>{" "}
            Спроектируйте и обучите свёрточную сеть с нуля на выбранном датасете.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Feature extractor.</strong>{" "}
            Используйте предобученную модель как экстрактор признаков, заморозив все
            веса, и обучите только классификатор.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Fine-tuning.</strong>{" "}
            Разморозьте последние блоки предобученной модели и дообучите на целевом
            датасете.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Сравнение.</strong>{" "}
            Сведите результаты трёх подходов в таблицу, постройте графики, матрицу
            ошибок.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Варианты
        </h2>
        <div className="mb-4">
          <VariantAssigner />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <th className="text-left py-2 pr-4 font-mono font-medium" style={{ color: "var(--text-tertiary)" }}>#</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--text-tertiary)" }}>Датасет</th>
                <th className="text-left py-2 font-medium" style={{ color: "var(--text-tertiary)" }}>Backbone</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr
                  key={v.n}
                  className="border-b"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <td className="py-2 pr-4 font-mono" style={{ color: "var(--accent)" }}>{v.n}</td>
                  <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>{v.dataset}</td>
                  <td className="py-2 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{v.backbone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Требования к отчёту
        </h2>
        <p className="text-sm max-w-prose" style={{ color: "var(--text-secondary)" }}>
          Отчёт оформляется в Jupyter Notebook или PDF. Включите: постановку задачи,
          код, графики train/val loss и accuracy, матрицу ошибок, сравнительную
          таблицу трёх решений, раздел «что не сработало».
        </p>
      </section>

      <section>
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Контрольные вопросы
        </h2>
        <ol className="list-decimal list-inside text-sm space-y-1 max-w-prose" style={{ color: "var(--text-secondary)" }}>
          {controlQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
