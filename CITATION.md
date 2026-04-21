# Data Sources

## v3 local development assets

Generated: 2026-04-21

Generator: `scripts/generate-training-data.py`

Purpose: local UI development and deterministic smoke testing for the guided tour.

Quality flag: development seed. Replace with real Colab outputs before using the stand as a graded/public laboratory reference.

Reference metrics currently shipped for development:

- Scratch CNN: test accuracy 0.742, trainable params 620 362
- ResNet-18 feature extractor: test accuracy 0.821, trainable params 5 130
- ResNet-18 fine-tune: test accuracy 0.883, trainable params 8 390 666

The intended publication source for these files is `colab/cnn-lab.ipynb` run end-to-end on Colab T4, followed by forward-pass activation export from the trained scratch CNN.

## Preset Images

Downloaded: 2026-04-21

Downloader: `scripts/download-preset-images.py`

Source catalog: `public/data/preset-image-sources.json`

The preset images under `public/data/transfer-presets/` and `public/images/conv-presets/` are normalized crops from Wikimedia Commons files. Licenses in the current set include CC0, public domain, CC BY 2.0, CC BY-SA 3.0, and CC BY-SA 4.0. Keep the source catalog with deployments so attribution can be audited.

## torchvision.models metrics

Source: [PyTorch torchvision.models documentation](https://pytorch.org/vision/stable/models.html)

Retrieved: April 2026

Fields used: model name, parameter count, Top-1 accuracy, Top-5 accuracy, GFLOPs, model size (MB), year of publication.

Models listed: resnet18, resnet34, resnet50, resnet101, resnet152, vgg11_bn, vgg16_bn, vgg19_bn, alexnet, mobilenet_v3_small, mobilenet_v3_large, efficientnet_b0, efficientnet_b3, densenet121, densenet161, convnext_tiny, convnext_base.

## Architecture layer data

Source: canonical architecture specifications from original papers and PyTorch `torchvision.models` implementations.

- LeNet-5: LeCun et al. (1998)
- AlexNet: Krizhevsky et al. (2012)
- VGG-16: Simonyan & Zisserman (2014)
- ResNet-18: He et al. (2015)

Parameter counts verified against `sum(p.numel() for p in model.parameters())` to within 2%.

## CIFAR-10

Source: Krizhevsky, A. (2009). "Learning Multiple Layers of Features from Tiny Images." Technical Report, University of Toronto.

## ImageNet-1k class names (Russian)

Machine-assisted translation. Quality flag: `machine-assisted`. Review recommended.
