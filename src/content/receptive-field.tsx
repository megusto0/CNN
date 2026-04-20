export default function ReceptiveFieldTheory() {
  return (
    <article className="max-w-prose text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      <p className="mb-4">
        Receptive field (рецептивное поле) нейрона — область входного изображения,
        которая влияет на значение этого нейрона. Понимание рецептивного поля необходимо
        для осознанного выбора архитектуры.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Рост с глубиной
      </h2>
      <p className="mb-4">
        Один свёрточный слой с ядром 3×3 даёт рецептивное поле 3×3. Два последовательных
        слоя 3×3 — рецептивное поле 5×5. Три — 7×7. Это одна из причин, по которым
        глубокие сети с маленькими ядрами (VGG) эффективнее мелких с большими (AlexNet):
        та же область покрытия при меньшем числе параметров.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Влияние stride и pooling
      </h2>
      <p className="mb-4">
        Stride &gt; 1 и pooling увеличивают рецептивное поле быстрее. Max-pool 2×2
        удваивает эффективное рецептивное поле всех последующих слоёв. Поэтому
        ResNet-50 с stride 2 в начале достигает рецептивного поля, покрывающего всё
        изображение 224×224, уже к середине сети.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Residual connections
      </h2>
      <p className="mb-4">
        В ResNet skip connections не меняют рецептивное поле, но позволяют обучать
        значительно более глубокие сети без проблемы затухающего градиента.
        Блок bottleneck (1×1 → 3×3 → 1×1) уменьшает число вычислений при том же
        рецептивном поле, что и обычный 3×3 → 3×3.
      </p>

      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        Практическое значение
      </h2>
      <p className="mb-4">
        Если объекты на изображениях маленькие, а рецептивное поле последних слоёв
        слишком велико, информация может «размазаться». Для задач с мелкими объектами
        (медицина, спутниковые снимки) используют архитектуры с сохранением высокого
        разрешения (U-Net, FPN).
      </p>
    </article>
  );
}
