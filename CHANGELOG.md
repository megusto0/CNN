# Changelog

## v3.0.0 — 2026-04-21

Guided-tour migration.

- Added landing page plus 11 linear step routes for the CNN laboratory.
- Added shared StepChrome: progress beads, topbar, TOC, prev/next keyboard navigation, localStorage progress.
- Added ConceptCheck, CodeBlock, ShapeTag, and the three honest status tags: live, interactive, replay.
- Embedded the former conv and pool interactions into Steps 2 and 4.
- Added guided components for CIFAR browsing, dimension calculation, scratch CNN builder, forward-pass walker, transfer learning, transfer mode comparison, Colab launch, training analysis, and report generation.
- Added local asset generation via `scripts/generate-training-data.py`.
- Added real preset image download/normalization via `scripts/download-preset-images.py`.
- Replaced `scripts/dump-forward-pass.py` with a real checkpoint-based exporter for Step 6 activation manifests, binaries, input images, and filter weights.
- Added generated development assets under `public/data/` for CIFAR samples, replay curves, confusion matrices, misclassifications, transfer presets, and forward-pass manifests.
- Added `colab/cnn-lab.ipynb` scaffold and `scripts/dump-forward-pass.py`.
- Removed TF.js from dependencies and replaced the old MNIST training component with a removal notice.
- Moved old routes behind `/legacy/*`; the default experience is now the guided tour.

Removed from the primary product: MNIST browser training, the standalone playground hub, standalone comparison route, standalone submit checklist, and synthetic in-browser training narrative.

## v1.0.0 — 2026-04-21

Initial release.

- 8 hash-routed pages: Overview, Theory, Assignment, Playground, Transfer, Training, Compare, Submit
- Conv Playground with live 2D convolution, kernel presets, stride/padding/ReLU
- Pooling Visualizer with editable grid, max/avg modes
- Architecture Browser for LeNet-5, AlexNet, VGG-16, ResNet-18
- Transfer Demo with ONNX Runtime Web ResNet-50 inference + CAM heatmap
- MNIST Training with TF.js in-browser training + drawing canvas
- Comparison Matrix of 17 torchvision models with Pareto scatter plot
- Submission self-check with 10-item checklist + progress ring
- 5 theory subpages with embedded interactive components
- Dark theme, self-hosted fonts, reduced-motion support
