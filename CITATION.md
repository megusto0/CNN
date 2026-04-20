# Data Sources

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
