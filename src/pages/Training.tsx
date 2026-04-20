import PageHeader from "../components/layout/PageHeader";
import MNISTTraining from "../features/mnist-training/MNISTTraining";

export default function Training() {
  return (
    <div>
      <PageHeader title="Обучение CNN в браузере" />
      <p
        className="text-sm max-w-prose mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Маленькая свёрточная сеть на 2000 примерах MNIST, обучение занимает 15–30
        секунд. Это демонстрация, а не рабочий процесс — реальные эксперименты
        лаборатории выполняются в Google CoLab с GPU.
      </p>
      <MNISTTraining />
    </div>
  );
}
