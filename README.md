# CNN Lab Stand

Интерактивный стенд v3 для лабораторной работы по CNN и transfer learning. Главный сценарий теперь линейный: landing page и 11 шагов `/#/1` ... `/#/11`. Старые страницы оставлены только под `/legacy/*`.

## Запуск

```bash
pnpm install
pnpm dev
```

## Проверка

```bash
pnpm lint
pnpm build
```

Результат сборки находится в `dist/`. Приложение статическое, поэтому деплой подходит для GitHub Pages, Cloudflare Pages или любого static hosting.

## Маршруты v3

- `/#/` — landing page
- `/#/1` ... `/#/11` — линейный guided tour
- `/#/glossary` — краткий справочник
- `/#/legacy/*` — старые v1 страницы для сравнения во время миграции

## Данные и ассеты

Для локальной разработки есть генератор:

```bash
python3 scripts/generate-training-data.py
python3 scripts/download-preset-images.py
```

Он создает:

- `public/data/cifar-samples.bin`
- `public/data/training-runs/{scratch,feature-extractor,fine-tune}.json`
- `public/data/training-runs/summary.json`
- `public/data/misclassifications/*`
- `public/data/forward-pass/*`
- `public/data/transfer-presets/*`
- `public/images/conv-presets/*`
- `public/data/preset-image-sources.json`
- `colab/cnn-lab.ipynb`

Важно: локальные JSON/bin training assets являются воспроизводимым development seed. Для публикации лабораторной их нужно заменить результатами полного запуска `colab/cnn-lab.ipynb` на Colab T4 и выгрузкой активаций из настоящей обученной scratch CNN. Preset images скачиваются отдельно из Wikimedia Commons и имеют provenance в `public/data/preset-image-sources.json`.

## CoLab notebook

Ноутбук лежит в `colab/cnn-lab.ipynb` и отражает нужную структуру из 12 ячеек: setup, CIFAR-10 data, scratch CNN, обучение и оценка, feature extractor, fine-tune, экспорт `cnn-lab-artifacts.zip`.

## Real Step 6 forward pass

Step 6 читает активации из `public/data/forward-pass/{cat,dog,automobile,ship,frog}/`.

Чтобы заменить development seed на реальные активации:

1. Запустите `colab/cnn-lab.ipynb` до конца.
2. Скачайте `cnn-lab-artifacts.zip` или `scratch-cnn.pt`.
3. Выполните:

```bash
pip install torch torchvision pillow numpy
python3 scripts/dump-forward-pass.py \
  --checkpoint artifacts/scratch-cnn.pt \
  --out public/data/forward-pass \
  --download
```

Скрипт выберет по одному изображению CIFAR-10 для `cat`, `dog`, `automobile`, `ship`, `frog`, сохранит `input.png`, бинарные `layer_XX.bin`, веса фильтров и `manifest.json`.

## Real Step 1/8/10 results

Step 1, Step 8 и Step 10 читают метрики из `public/data/training-runs/`.

Чтобы заменить development seed на реальные метрики Colab:

```bash
mkdir -p ../artifacts
unzip -o ~/Downloads/cnn-lab-artifacts.zip -d ../artifacts
python3 scripts/import-colab-results.py \
  --results ../artifacts/results.json \
  --artifact-dir ../artifacts \
  --scratch-checkpoint ../artifacts/scratch-cnn.pt \
  --download
```

`cnn-lab-artifacts.zip` содержит `results.json`, `manifest.json`, `scratch-cnn.pt`, `feature-extractor.pt`, `fine-tune.pt` и `misclassifications/{scratch,feature_extractor,fine_tune}/`. `results.json` сохраняет curves, время обучения, test accuracy, confusion matrix, per-class accuracy и метаданные ошибок.

## ONNX ResNet-50

Для настоящего live-инференса Step 7 нужны файлы в `public/models/`:

```bash
pip install torch torchvision onnx onnxruntime
python3 scripts/export-resnet.py
```

Ожидаемые файлы:

- `resnet50-int8.onnx`
- `resnet50-lastconv.onnx`
- `resnet50-fc-weight.bin`
- `resnet50-fc-bias.bin`

## Технологии

- Vite + TypeScript strict
- React + React Router hash routing
- Tailwind 3 + local design tokens
- D3 для графиков
- ONNX Runtime Web для ResNet-50 legacy/live assets
- Self-hosted Inter and JetBrains Mono fonts

## Что удалено из основного сценария

- отдельные `/training`, `/playground`, `/compare`, `/submit` маршруты
- TF.js MNIST training demo
- синтетическое browser training как педагогический сценарий

Все обучение CIFAR-10 должно происходить в Colab, а сайт показывает интерактивную математику, live/precomputed inference views и replay сохраненных результатов.
