#!/usr/bin/env python3
"""Dump real SimpleCNN forward-pass activations for Step 6.

Run this after training the scratch CNN in `colab/cnn-lab.ipynb` and downloading
`scratch-cnn.pt`.

Example:
    python3 scripts/dump-forward-pass.py \
      --checkpoint artifacts/scratch-cnn.pt \
      --out public/data/forward-pass \
      --download

The script writes, for each selected CIFAR-10 class:
    public/data/forward-pass/{class}/input.png
    public/data/forward-pass/{class}/manifest.json
    public/data/forward-pass/{class}/layer_XX.bin
    public/data/forward-pass/{class}/filters_*.bin
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
import torchvision
from PIL import Image
from torchvision import datasets, transforms


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CLASSES = ("cat", "dog", "automobile", "ship", "frog")
CIFAR_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR_STD = (0.2470, 0.2435, 0.2616)


class SimpleCNN(nn.Module):
    def __init__(self, num_classes: int = 10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkpoint", required=True, type=Path, help="Path to scratch-cnn.pt from Colab.")
    parser.add_argument("--out", default=ROOT / "public" / "data" / "forward-pass", type=Path)
    parser.add_argument("--data-root", default=ROOT / "data", type=Path)
    parser.add_argument("--split", choices=["train", "test"], default="test")
    parser.add_argument("--device", default="auto", help="auto, cpu, cuda, cuda:0, ...")
    parser.add_argument("--download", action="store_true", help="Download CIFAR-10 if missing.")
    parser.add_argument("--classes", nargs="+", default=list(DEFAULT_CLASSES), help="CIFAR-10 class names to export.")
    return parser.parse_args()


def resolve_device(name: str) -> torch.device:
    if name == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(name)


def load_model(checkpoint: Path, device: torch.device) -> SimpleCNN:
    model = SimpleCNN().to(device)
    payload = torch.load(checkpoint, map_location=device)
    state_dict = payload.get("state_dict", payload) if isinstance(payload, dict) else payload
    state_dict = {key.removeprefix("module."): value for key, value in state_dict.items()}
    model.load_state_dict(state_dict)
    model.eval()
    return model


def module_params(module: nn.Module) -> int:
    return sum(param.numel() for param in module.parameters(recurse=True))


def layer_plan(model: SimpleCNN) -> list[tuple[str, nn.Module, str]]:
    return [
        ("Conv1", model.features[0], "features.0"),
        ("ReLU1", model.features[1], "features.1"),
        ("MaxPool1", model.features[2], "features.2"),
        ("Conv2", model.features[3], "features.3"),
        ("ReLU2", model.features[4], "features.4"),
        ("MaxPool2", model.features[5], "features.5"),
        ("Conv3", model.features[6], "features.6"),
        ("ReLU3", model.features[7], "features.7"),
        ("MaxPool3", model.features[8], "features.8"),
        ("Flatten", model.classifier[0], "classifier.0"),
        ("fc1", model.classifier[1], "classifier.1"),
        ("ReLU4", model.classifier[2], "classifier.2"),
        ("Dropout", model.classifier[3], "classifier.3"),
        ("fc2", model.classifier[4], "classifier.4"),
    ]


def tensor_to_numpy(tensor: torch.Tensor) -> np.ndarray:
    array = tensor.detach().cpu().squeeze(0).contiguous().numpy().astype("float32")
    return array


def save_array(path: Path, array: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    array.astype("float32", copy=False).tofile(path)


def shape_without_batch(tensor: torch.Tensor) -> list[int]:
    return list(tensor.detach().shape[1:])


def pick_examples(dataset: datasets.CIFAR10, class_names: list[str]) -> dict[str, int]:
    name_to_idx = {name: idx for idx, name in enumerate(dataset.classes)}
    selected: dict[str, int] = {}
    missing = [name for name in class_names if name not in name_to_idx]
    if missing:
        raise ValueError(f"Unknown CIFAR-10 classes: {missing}. Available: {dataset.classes}")
    targets = {name_to_idx[name]: name for name in class_names}
    for index, label in enumerate(dataset.targets):
        if label in targets and targets[label] not in selected:
            selected[targets[label]] = index
        if len(selected) == len(class_names):
            break
    return selected


def image_to_tensor(image: Image.Image) -> torch.Tensor:
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(CIFAR_MEAN, CIFAR_STD),
    ])
    return transform(image).unsqueeze(0)


def save_input_png(image: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)


def run_layers(model: SimpleCNN, x: torch.Tensor) -> tuple[list[dict[str, Any]], torch.Tensor]:
    layers: list[dict[str, Any]] = []
    input_array = tensor_to_numpy(x)
    save_array_placeholder = {
        "name": "Input",
        "shape": list(input_array.shape),
        "file": "layer_00.bin",
        "dtype": "float32",
        "params": 0,
    }
    layers.append(save_array_placeholder)

    current = x
    for index, (name, module, module_path) in enumerate(layer_plan(model), start=1):
        current = module(current)
        layers.append({
            "name": name,
            "shape": shape_without_batch(current),
            "file": f"layer_{index:02d}.bin",
            "dtype": "float32",
            "params": module_params(module),
            "module": module_path,
        })
    return layers, current


def write_filter_weights(model: SimpleCNN, target_dir: Path) -> dict[str, str]:
    filters = {
        "Conv1": ("filters_conv1.bin", model.features[0]),
        "Conv2": ("filters_conv2.bin", model.features[3]),
        "Conv3": ("filters_conv3.bin", model.features[6]),
    }
    manifest_filters: dict[str, str] = {}
    for name, (filename, module) in filters.items():
        weight = module.weight.detach().cpu().contiguous().numpy().astype("float32")
        save_array(target_dir / filename, weight)
        manifest_filters[name] = filename
    return manifest_filters


def commentary_for(image_name: str, layer_name: str) -> str:
    if layer_name == "Input":
        return f"Это исходный нормализованный тензор CIFAR-10 для класса {image_name}."
    if layer_name.startswith("Conv"):
        return "Свёртка увеличивает число каналов: разные фильтры отвечают на разные локальные структуры."
    if layer_name.startswith("ReLU"):
        return "ReLU зануляет отрицательные ответы и оставляет только положительные активации."
    if layer_name.startswith("MaxPool"):
        return "MaxPool уменьшает пространственную сетку и сохраняет сильнейшие локальные ответы."
    if layer_name == "Flatten":
        return "Flatten разворачивает последние карты признаков в один вектор для классификатора."
    if layer_name.startswith("fc"):
        return "Полносвязный слой превращает признаки в компактное решение о классе."
    return "Этот слой сохраняет форму представления и готовит его к следующей операции."


def export_one(model: SimpleCNN, dataset: datasets.CIFAR10, class_name: str, index: int, out_dir: Path, device: torch.device) -> None:
    image, label = dataset[index]
    if not isinstance(image, Image.Image):
        raise TypeError("Expected PIL image from CIFAR-10 raw dataset.")
    target_dir = out_dir / class_name
    target_dir.mkdir(parents=True, exist_ok=True)
    save_input_png(image, target_dir / "input.png")

    x = image_to_tensor(image).to(device)
    layers, logits = run_layers(model, x)
    save_array(target_dir / "layer_00.bin", tensor_to_numpy(x))

    current = x
    for layer_index, (_name, module, _module_path) in enumerate(layer_plan(model), start=1):
        current = module(current)
        save_array(target_dir / f"layer_{layer_index:02d}.bin", tensor_to_numpy(current))

    probs = torch.softmax(logits, dim=1).detach().cpu().squeeze(0)
    pred_idx = int(probs.argmax())
    commentary = {layer["name"]: commentary_for(class_name, layer["name"]) for layer in layers}
    manifest = {
        "source": "scratch-cnn checkpoint + torchvision.datasets.CIFAR10",
        "source_index": index,
        "input_image": "input.png",
        "true": dataset.classes[label],
        "predicted": dataset.classes[pred_idx],
        "probability": float(probs[pred_idx]),
        "layers": layers,
        "filters": write_filter_weights(model, target_dir),
        "commentary": commentary,
    }
    (target_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    args = parse_args()
    device = resolve_device(args.device)
    model = load_model(args.checkpoint, device)
    dataset = torchvision.datasets.CIFAR10(
        root=args.data_root,
        train=args.split == "train",
        download=args.download,
        transform=None,
    )
    selected = pick_examples(dataset, args.classes)
    args.out.mkdir(parents=True, exist_ok=True)
    for class_name in args.classes:
        export_one(model, dataset, class_name, selected[class_name], args.out, device)
        print(f"exported {class_name}: CIFAR-10 {args.split} index {selected[class_name]}")
    print(f"Done. Files written to {args.out}")


if __name__ == "__main__":
    main()
