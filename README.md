# CNN Lab Stand

Интерактивный стенд для лабораторной работы по свёрточным нейронным сетям и transfer learning.

## Запуск

```bash
pnpm install
pnpm dev
```

## Сборка

```bash
pnpm build
```

Результат в `dist/`. Деплой — любой статический хостинг (GitHub Pages, Cloudflare Pages).

## Генерация ONNX-ассетов

Для работы Transfer Demo нужны файлы в `public/models/`:

```bash
pip install torch torchvision onnx onnxruntime
python scripts/export-resnet.py
```

Необходимые файлы:
- `resnet50-int8.onnx` (~25MB, квантованный классификатор)
- `resnet50-lastconv.onnx` (feature map до avgpool для CAM)
- `resnet50-fc-weight.bin` (веса fc-слоя для CAM)

Без этих файлов Transfer Demo покажет сообщение об ошибке при инференсе.

## Технологии

- Vite 5 + TypeScript (strict)
- React 18 с React Router 6 (hash routing)
- Tailwind 3 (utility-only) + custom design tokens
- Motion (Framer Motion) для анимаций
- D3 7 для визуализаций
- ONNX Runtime Web (WASM + SIMD) для ResNet-50
- TensorFlow.js для MNIST training demo (code-split)

## Структура

```
src/
├── components/     # Переиспользуемые UI-компоненты
├── features/       # Фичи: conv-playground, transfer-demo, mnist-training...
├── pages/          # Страницы (роуты)
├── content/        # Теория (React-компоненты вместо MDX)
├── lib/            # Утилиты: onnx, cam, conv, storage
└── design/         # Design tokens, reset CSS, motion configs
```

## Ограничения v1

- Только тёмная тема
- Только русский язык
- ONNX-модели нужно генерировать вручную
- MNIST training использует синтетические данные для демо
