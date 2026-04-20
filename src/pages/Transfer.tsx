import PageHeader from "../components/layout/PageHeader";
import TransferDemo from "../features/transfer-demo/TransferDemo";

export default function Transfer() {
  return (
    <div>
      <PageHeader title="Transfer learning: ResNet-50 вживую" />
      <p
        className="text-sm max-w-prose mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Модель ResNet-50, предобученная на ImageNet, работает прямо в браузере.
        Загрузите картинку или выберите одну из предложенных — сеть выдаст топ-5
        классов и покажет, на какие участки изображения она опиралась (Class
        Activation Map).
      </p>

      <details className="mb-6">
        <summary
          className="text-xs cursor-pointer select-none"
          style={{ color: "var(--text-tertiary)" }}
        >
          Как работает CAM (подробнее)
        </summary>
        <div
          className="mt-2 p-3 rounded-md text-xs max-w-prose leading-relaxed"
          style={{
            backgroundColor: "var(--bg-raised)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          Это CAM, а не Grad-CAM. CAM использует веса финального слоя fc как
          коэффициенты важности каналов последней карты признаков — не требует
          обратного распространения и потому работает в ONNX Runtime Web.
          Grad-CAM обобщает этот метод на сети без global average pooling.
        </div>
      </details>

      <TransferDemo />
    </div>
  );
}
