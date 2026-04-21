#!/usr/bin/env python3
"""Generate local reference assets for the v3 guided tour.

The publication workflow should replace the generated training JSON with the
output of colab/cnn-lab.ipynb. This script keeps the Vite app fully browsable
while those heavier runs are regenerated.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CLASSES = [
    "airplane",
    "automobile",
    "bird",
    "cat",
    "deer",
    "dog",
    "frog",
    "horse",
    "ship",
    "truck",
]


def ensure_dirs() -> None:
    for path in [
        PUBLIC / "data" / "training-runs",
        PUBLIC / "data" / "misclassifications",
        PUBLIC / "data" / "transfer-presets",
        PUBLIC / "data" / "forward-pass",
        PUBLIC / "models",
        ROOT / "colab",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def class_color(index: int) -> tuple[int, int, int]:
    palette = [
        (75, 125, 210),
        (210, 70, 80),
        (210, 165, 60),
        (160, 120, 85),
        (120, 170, 85),
        (175, 135, 90),
        (70, 180, 105),
        (170, 120, 210),
        (60, 145, 185),
        (190, 120, 70),
    ]
    return palette[index % len(palette)]


def tiny_image(cls: int, variant: int, size: int = 32) -> Image.Image:
    rng = np.random.default_rng(cls * 1000 + variant)
    base = np.zeros((size, size, 3), dtype=np.uint8)
    color = np.array(class_color(cls), dtype=np.uint8)
    yy, xx = np.mgrid[0:size, 0:size]
    base[:, :] = (color * 0.35 + np.array([22, 24, 30]) * 0.65).astype(np.uint8)
    if cls in [0, 8]:
        stripe = np.abs(yy - (size // 2 + np.sin(xx / 4) * 3)) < 3
        base[stripe] = color
    elif cls in [1, 9]:
        base[size // 3 : size // 3 * 2, 5 : size - 5] = color
        base[size // 3 * 2 - 3 : size // 3 * 2 + 2, 8 : size - 8] = (35, 35, 38)
    elif cls in [3, 5]:
        rr = (xx - size // 2) ** 2 + (yy - size // 2) ** 2
        base[rr < (size // 3) ** 2] = color
        base[7:12, 8:13] = np.clip(color + 35, 0, 255)
        base[7:12, 19:24] = np.clip(color + 35, 0, 255)
    elif cls in [2, 6]:
        mask = ((xx + yy + variant) % 9) < 4
        base[mask] = color
    else:
        mask = np.abs(xx - yy + variant) < 4
        base[mask] = color
    noise = rng.normal(0, 16, base.shape)
    base = np.clip(base.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(base, "RGB")


def write_cifar_samples() -> None:
    raw = np.zeros((100, 3, 32, 32), dtype=np.uint8)
    labels = []
    for cls, class_name in enumerate(CLASSES):
        for variant in range(10):
            index = cls * 10 + variant
            arr = np.asarray(tiny_image(cls, variant), dtype=np.uint8)
            raw[index] = arr.transpose(2, 0, 1)
            labels.append({
                "label": cls,
                "className": class_name,
                "filename": f"{class_name}_{variant:02d}.png",
            })
    (PUBLIC / "data" / "cifar-samples.bin").write_bytes(raw.tobytes())
    (PUBLIC / "data" / "cifar-samples-labels.json").write_text(
        json.dumps(labels, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def make_curve(epochs: int, start: float, target: float, overfit: bool = False) -> list[float]:
    values = []
    for idx in range(epochs):
        t = idx / max(1, epochs - 1)
        value = start + (target - start) * (1 - math.exp(-4.2 * t))
        if overfit and idx > 10:
            value -= (idx - 10) * 0.0048
        values.append(round(value, 4))
    return values


def make_run(name: str, display: str, epochs: int, target: float, params: int, minutes: int) -> dict:
    overfit = name == "scratch"
    val_acc = make_curve(epochs, 0.24, target - 0.012, overfit)
    train_acc = [round(min(0.985, value + 0.035 + idx * 0.008), 4) for idx, value in enumerate(val_acc)]
    val_loss = [round(2.2 - value * 1.52 + (idx / epochs) * (0.18 if overfit else 0.04), 4) for idx, value in enumerate(val_acc)]
    train_loss = [round(2.28 - value * 1.76 - idx * 0.012, 4) for idx, value in enumerate(train_acc)]
    confusion = []
    for y, true_name in enumerate(CLASSES):
        row = []
        for x, pred_name in enumerate(CLASSES):
            if x == y:
                row.append(int(72 + target * 32 + (y % 3)))
            elif {true_name, pred_name} == {"cat", "dog"}:
                row.append(28 if name == "scratch" else 12)
            elif {true_name, pred_name} in [{"truck", "automobile"}, {"ship", "airplane"}]:
                row.append(13 if name == "scratch" else 7)
            else:
                row.append((x + y) % 4)
        confusion.append(row)
    per_class_acc = {
        class_name: round(max(0.55, min(0.96, target + (idx - 5) * 0.009)), 4)
        for idx, class_name in enumerate(CLASSES)
    }
    mis = []
    miss_dir = PUBLIC / "data" / "misclassifications" / name
    miss_dir.mkdir(parents=True, exist_ok=True)
    for idx in range(30):
        true_idx = (idx + 3) % len(CLASSES)
        pred_idx = (idx + 4) % len(CLASSES)
        image = tiny_image(true_idx, idx, 64)
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        draw.ellipse((14, 10, 52, 48), fill=(253, 231, 37, 62))
        image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
        filename = f"miss_{idx:03d}.png"
        image.save(miss_dir / filename)
        mis.append({
            "image_path": filename,
            "true": CLASSES[true_idx],
            "pred": CLASSES[pred_idx],
            "confidence": round(0.56 + idx * 0.012, 3),
        })
    return {
        "name": name,
        "display_name": display,
        "epochs": epochs,
        "batch_size": 128,
        "optimizer": "Adam",
        "lr": 0.001,
        "trainable_params": params,
        "time_min": minutes,
        "train_loss": train_loss,
        "train_acc": train_acc,
        "val_loss": val_loss,
        "val_acc": val_acc,
        "test_acc": target,
        "confusion": confusion,
        "per_class_acc": per_class_acc,
        "misclassifications": mis,
    }


def write_training_runs() -> None:
    specs = [
        ("scratch", "Scratch CNN", 20, 0.742, 620_362, 10, "scratch.json"),
        ("feature_extractor", "ResNet-18 feature extractor", 10, 0.821, 5_130, 4, "feature-extractor.json"),
        ("fine_tune", "ResNet-18 fine-tune", 10, 0.883, 8_390_666, 10, "fine-tune.json"),
    ]
    summary = []
    for name, display, epochs, target, params, minutes, filename in specs:
        run = make_run(name, display, epochs, target, params, minutes)
        (PUBLIC / "data" / "training-runs" / filename).write_text(
            json.dumps(run, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        summary.append({
            "id": name,
            "name": display,
            "trainable_params": params,
            "time_min": minutes,
            "test_acc": target,
        })
    (PUBLIC / "data" / "training-runs" / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def write_transfer_presets() -> None:
    mapping = {
        "cat": 3,
        "dog": 5,
        "car": 1,
        "pizza": 6,
        "cifar-resize": 8,
    }
    for name, cls in mapping.items():
        image = tiny_image(cls, 42, 224).resize((320, 320), Image.Resampling.NEAREST)
        if name == "pizza":
            image = image.filter(ImageFilter.GaussianBlur(0.8))
            draw = ImageDraw.Draw(image)
            draw.ellipse((56, 56, 264, 264), fill=(190, 95, 45))
            draw.ellipse((78, 78, 242, 242), fill=(235, 190, 75))
            for x, y in [(120, 118), (178, 144), (146, 202), (210, 198)]:
                draw.ellipse((x - 12, y - 12, x + 12, y + 12), fill=(160, 40, 40))
        image.save(PUBLIC / "data" / "transfer-presets" / f"{name}.png")


def write_forward_pass() -> None:
    layer_shapes = [
        ("Input", [3, 32, 32], 0),
        ("Conv1", [32, 32, 32], 896),
        ("ReLU1", [32, 32, 32], 0),
        ("MaxPool1", [32, 16, 16], 0),
        ("Conv2", [64, 16, 16], 18496),
        ("ReLU2", [64, 16, 16], 0),
        ("MaxPool2", [64, 8, 8], 0),
        ("Conv3", [128, 8, 8], 73856),
        ("ReLU3", [128, 8, 8], 0),
        ("MaxPool3", [128, 4, 4], 0),
        ("Flatten", [2048], 0),
    ]
    for image_name in ["cat", "dog", "automobile", "ship", "frog"]:
        image_dir = PUBLIC / "data" / "forward-pass" / image_name
        image_dir.mkdir(parents=True, exist_ok=True)
        manifest_layers = []
        seed = sum(ord(ch) for ch in image_name)
        for idx, (layer_name, shape, params) in enumerate(layer_shapes):
            rng = np.random.default_rng(seed + idx * 17)
            data = rng.normal(0, 0.7, int(np.prod(shape))).astype("float32")
            filename = f"layer_{idx:02d}.bin"
            data.tofile(image_dir / filename)
            manifest_layers.append({
                "name": layer_name,
                "shape": shape,
                "file": filename,
                "dtype": "float32",
                "params": params,
            })
        manifest = {
            "layers": manifest_layers,
            "filters": {},
            "commentary": {
                layer[0]: f"{layer[0]} показывает, как меняется представление объекта {image_name}."
                for layer in layer_shapes
            },
        }
        (image_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def write_notebook() -> None:
    cells = [
        """# cell 1 — setup
!pip install -q torchvision
import json, random, time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models
from torchvision.models import ResNet18_Weights

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.backends.cudnn.benchmark = True
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = ["airplane", "automobile", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"]
print(f"PyTorch {torch.__version__}, CUDA: {torch.cuda.is_available()}, device={DEVICE}")""",
        """# cell 2 — data
data_root = Path("./data")
scratch_train_tf = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616)),
])
scratch_eval_tf = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616)),
])
resnet_train_tf = transforms.Compose([
    transforms.Resize(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
])
resnet_eval_tf = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
])

scratch_full = datasets.CIFAR10(data_root, train=True, download=True, transform=scratch_train_tf)
scratch_val_source = datasets.CIFAR10(data_root, train=True, download=False, transform=scratch_eval_tf)
resnet_full = datasets.CIFAR10(data_root, train=True, download=False, transform=resnet_train_tf)
resnet_val_source = datasets.CIFAR10(data_root, train=True, download=False, transform=resnet_eval_tf)
generator = torch.Generator().manual_seed(SEED)
train_idx, val_idx = random_split(range(50_000), [45_000, 5_000], generator=generator)

def subset(dataset, indices):
    return torch.utils.data.Subset(dataset, list(indices))

scratch_train_loader = DataLoader(subset(scratch_full, train_idx), batch_size=128, shuffle=True, num_workers=2, pin_memory=True)
scratch_val_loader = DataLoader(subset(scratch_val_source, val_idx), batch_size=256, shuffle=False, num_workers=2, pin_memory=True)
scratch_test_loader = DataLoader(datasets.CIFAR10(data_root, train=False, download=True, transform=scratch_eval_tf), batch_size=256, shuffle=False, num_workers=2, pin_memory=True)

resnet_train_loader = DataLoader(subset(resnet_full, train_idx), batch_size=64, shuffle=True, num_workers=2, pin_memory=True)
resnet_val_loader = DataLoader(subset(resnet_val_source, val_idx), batch_size=128, shuffle=False, num_workers=2, pin_memory=True)
resnet_test_loader = DataLoader(datasets.CIFAR10(data_root, train=False, download=False, transform=resnet_eval_tf), batch_size=128, shuffle=False, num_workers=2, pin_memory=True)
print("Data ready")""",
        """# cell 3 — Scratch CNN architecture
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))

def trainable_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

def run_epoch(model, loader, optimizer=None):
    training = optimizer is not None
    model.train(training)
    total_loss, total_correct, total_seen = 0.0, 0, 0
    for x, y in loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        if training:
            optimizer.zero_grad(set_to_none=True)
        logits = model(x)
        loss = F.cross_entropy(logits, y)
        if training:
            loss.backward()
            optimizer.step()
        total_loss += loss.item() * x.size(0)
        total_correct += (logits.argmax(1) == y).sum().item()
        total_seen += x.size(0)
    return total_loss / total_seen, total_correct / total_seen

def fit(model, train_loader, val_loader, epochs, optimizer):
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    for epoch in range(1, epochs + 1):
        start = time.time()
        train_loss, train_acc = run_epoch(model, train_loader, optimizer)
        with torch.no_grad():
            val_loss, val_acc = run_epoch(model, val_loader)
        for key, value in [("train_loss", train_loss), ("train_acc", train_acc), ("val_loss", val_loss), ("val_acc", val_acc)]:
            history[key].append(float(value))
        print(f"{epoch:02d}/{epochs} train_acc={train_acc:.3f} val_acc={val_acc:.3f} time={time.time()-start:.1f}s")
    return history

def evaluate(model, loader, max_misclassified=30):
    model.eval()
    confusion = torch.zeros(10, 10, dtype=torch.int64)
    total_correct, total_seen = 0, 0
    misclassified = []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            logits = model(x)
            probs = logits.softmax(1)
            pred = probs.argmax(1)
            total_correct += (pred == y).sum().item()
            total_seen += x.size(0)
            for true, guessed in zip(y.cpu(), pred.cpu()):
                confusion[int(true), int(guessed)] += 1
            wrong = (pred != y).nonzero(as_tuple=False).flatten()
            for idx in wrong[: max(0, max_misclassified - len(misclassified))]:
                misclassified.append({
                    "true": CLASSES[int(y[idx])],
                    "pred": CLASSES[int(pred[idx])],
                    "confidence": float(probs[idx, pred[idx]].detach().cpu()),
                    "image_path": f"miss_{len(misclassified):03d}.png",
                })
    per_class = (confusion.diag() / confusion.sum(1).clamp_min(1)).tolist()
    return {
        "test_acc": total_correct / total_seen,
        "confusion": confusion.tolist(),
        "per_class_acc": {name: float(per_class[i]) for i, name in enumerate(CLASSES)},
        "misclassifications": misclassified,
    }""",
        """# cell 4 — Scratch CNN training
scratch = SimpleCNN().to(DEVICE)
scratch_optimizer = torch.optim.Adam(scratch.parameters(), lr=1e-3)
scratch_history = fit(scratch, scratch_train_loader, scratch_val_loader, epochs=20, optimizer=scratch_optimizer)""",
        """# cell 5 — Scratch CNN evaluation
scratch_eval = evaluate(scratch, scratch_test_loader)
scratch_result = {
    "name": "scratch",
    "epochs": 20,
    "batch_size": 128,
    "optimizer": "Adam",
    "lr": 1e-3,
    "trainable_params": trainable_params(scratch),
    **scratch_history,
    **scratch_eval,
}
torch.save(scratch.state_dict(), "scratch-cnn.pt")
print("Scratch test_acc", scratch_result["test_acc"])""",
        """# cell 6 — ResNet-18 feature extractor setup
def make_feature_extractor():
    model = models.resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
    for p in model.parameters():
        p.requires_grad = False
    model.fc = nn.Linear(model.fc.in_features, 10)
    return model.to(DEVICE)

feature_extractor = make_feature_extractor()
feature_optimizer = torch.optim.Adam(feature_extractor.fc.parameters(), lr=1e-3)
print("trainable", trainable_params(feature_extractor))""",
        """# cell 7 — Feature extractor training
feature_history = fit(feature_extractor, resnet_train_loader, resnet_val_loader, epochs=10, optimizer=feature_optimizer)""",
        """# cell 8 — Feature extractor evaluation
feature_eval = evaluate(feature_extractor, resnet_test_loader)
feature_result = {
    "name": "feature_extractor",
    "epochs": 10,
    "batch_size": 64,
    "optimizer": "Adam",
    "lr": 1e-3,
    "trainable_params": trainable_params(feature_extractor),
    **feature_history,
    **feature_eval,
}
print("Feature extractor test_acc", feature_result["test_acc"])""",
        """# cell 9 — Fine-tune setup
fine_tune = models.resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
for p in fine_tune.parameters():
    p.requires_grad = False
for p in fine_tune.layer4.parameters():
    p.requires_grad = True
fine_tune.fc = nn.Linear(fine_tune.fc.in_features, 10)
fine_tune = fine_tune.to(DEVICE)
fine_optimizer = torch.optim.Adam([
    {"params": fine_tune.layer4.parameters(), "lr": 1e-4},
    {"params": fine_tune.fc.parameters(), "lr": 1e-3},
])
print("trainable", trainable_params(fine_tune))""",
        """# cell 10 — Fine-tune training
fine_history = fit(fine_tune, resnet_train_loader, resnet_val_loader, epochs=10, optimizer=fine_optimizer)""",
        """# cell 11 — Fine-tune evaluation
fine_eval = evaluate(fine_tune, resnet_test_loader)
fine_result = {
    "name": "fine_tune",
    "epochs": 10,
    "batch_size": 64,
    "optimizer": "Adam",
    "lr": {"layer4": 1e-4, "fc": 1e-3},
    "trainable_params": trainable_params(fine_tune),
    **fine_history,
    **fine_eval,
}
print("Fine-tune test_acc", fine_result["test_acc"])""",
        """# cell 12 — Export results
results = {
    "scratch": scratch_result,
    "feature_extractor": feature_result,
    "fine_tune": fine_result,
}
with open("results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(json.dumps({
    name: {
        "test_acc": round(run["test_acc"], 4),
        "trainable_params": run["trainable_params"],
    }
    for name, run in results.items()
}, indent=2))
try:
    from google.colab import files
    files.download("results.json")
    files.download("scratch-cnn.pt")
except Exception:
    print("results.json and scratch-cnn.pt saved locally")""",
    ]
    notebook = {
        "cells": [
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": cell.splitlines(True),
            }
            for cell in cells
        ],
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.11"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    (ROOT / "colab" / "cnn-lab.ipynb").write_text(json.dumps(notebook, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    write_cifar_samples()
    write_training_runs()
    write_transfer_presets()
    write_forward_pass()
    write_notebook()
    print("Generated v3 local reference assets.")


if __name__ == "__main__":
    main()
