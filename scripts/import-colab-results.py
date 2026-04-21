#!/usr/bin/env python3
"""Import Colab results.json into the static guided-tour data files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DEFAULT_RESULTS = ROOT.parent / "artifacts" / "results.json"
DEFAULT_CHECKPOINT = ROOT.parent / "artifacts" / "scratch-cnn.pt"

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

RUN_META = {
    "scratch": {
        "display_name": "Scratch CNN",
        "filename": "scratch.json",
    },
    "feature_extractor": {
        "display_name": "ResNet-18 feature extractor",
        "filename": "feature-extractor.json",
    },
    "fine_tune": {
        "display_name": "ResNet-18 fine-tune",
        "filename": "fine-tune.json",
    },
}

CIFAR_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR_STD = (0.2470, 0.2435, 0.2616)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--out", type=Path, default=PUBLIC / "data" / "training-runs")
    parser.add_argument("--misclass-out", type=Path, default=PUBLIC / "data" / "misclassifications")
    parser.add_argument("--scratch-checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    parser.add_argument("--data-root", type=Path, default=ROOT / "data")
    parser.add_argument("--download", action="store_true", help="Download CIFAR-10 if the local cache is missing.")
    parser.add_argument("--device", default="auto", help="auto, cpu, cuda, cuda:0, ...")
    return parser.parse_args()


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def resolve_time_min(run: dict[str, Any]) -> float | None:
    value = run.get("time_min")
    return float(value) if isinstance(value, int | float) else None


def normalize_misclassifications(run: dict[str, Any], include_images: bool) -> list[dict[str, Any]]:
    normalized = []
    for index, item in enumerate(run.get("misclassifications", [])):
        image_path = item.get("image_path") or f"miss_{index:03d}.png"
        normalized.append({
            "true": item["true"],
            "pred": item["pred"],
            "confidence": float(item["confidence"]),
            "image_path": image_path if include_images else None,
            "image_available": include_images,
        })
    return normalized


def normalize_run(run_id: str, run: dict[str, Any], source: Path, include_images: bool) -> dict[str, Any]:
    meta = RUN_META[run_id]
    return {
        "name": run_id,
        "display_name": meta["display_name"],
        "source": str(source),
        "real_metrics": True,
        "misclassification_images": "scratch checkpoint reconstruction" if include_images else "metadata only",
        "epochs": int(run["epochs"]),
        "batch_size": int(run["batch_size"]),
        "optimizer": run["optimizer"],
        "lr": run["lr"],
        "trainable_params": int(run["trainable_params"]),
        "time_min": resolve_time_min(run),
        "train_loss": [float(value) for value in run["train_loss"]],
        "train_acc": [float(value) for value in run["train_acc"]],
        "val_loss": [float(value) for value in run["val_loss"]],
        "val_acc": [float(value) for value in run["val_acc"]],
        "test_acc": float(run["test_acc"]),
        "confusion": run["confusion"],
        "per_class_acc": {key: float(value) for key, value in run["per_class_acc"].items()},
        "misclassifications": normalize_misclassifications(run, include_images),
    }


def summary_row(run_id: str, run: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": run_id,
        "name": RUN_META[run_id]["display_name"],
        "trainable_params": int(run["trainable_params"]),
        "time_min": resolve_time_min(run),
        "test_acc": float(run["test_acc"]),
        "real_metrics": True,
    }


def import_torch_modules() -> tuple[Any, Any, Any, Any]:
    import torch
    import torch.nn as nn
    import torchvision
    from torchvision import transforms

    return torch, nn, torchvision, transforms


def export_scratch_misclassification_images(args: argparse.Namespace, scratch_run: dict[str, Any]) -> bool:
    if not args.scratch_checkpoint.exists():
        print(f"scratch checkpoint not found: {args.scratch_checkpoint}")
        return False

    try:
        torch, nn, torchvision, transforms = import_torch_modules()
    except Exception as exc:
        print(f"could not import torch/torchvision, keeping scratch images metadata-only: {exc}")
        return False

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

        def forward(self, x: Any) -> Any:
            return self.classifier(self.features(x))

    device = torch.device("cuda" if args.device == "auto" and torch.cuda.is_available() else ("cpu" if args.device == "auto" else args.device))
    model = SimpleCNN().to(device)
    payload = torch.load(args.scratch_checkpoint, map_location=device)
    state_dict = payload.get("state_dict", payload) if isinstance(payload, dict) else payload
    state_dict = {key.removeprefix("module."): value for key, value in state_dict.items()}
    model.load_state_dict(state_dict)
    model.eval()

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(CIFAR_MEAN, CIFAR_STD),
    ])
    dataset = torchvision.datasets.CIFAR10(
        root=args.data_root,
        train=False,
        download=args.download,
        transform=None,
    )

    expected = scratch_run.get("misclassifications", [])
    actual: list[dict[str, Any]] = []
    with torch.no_grad():
        for index in range(len(dataset)):
            image, label = dataset[index]
            x = transform(image).unsqueeze(0).to(device)
            probs = model(x).softmax(1).detach().cpu().squeeze(0)
            pred = int(probs.argmax())
            if pred == int(label):
                continue
            actual.append({
                "true": CLASSES[int(label)],
                "pred": CLASSES[pred],
                "confidence": float(probs[pred]),
                "image": image,
            })
            if len(actual) == len(expected):
                break

    if len(actual) < len(expected):
        print(f"only reconstructed {len(actual)} scratch misses; expected {len(expected)}")
        return False

    for index, (observed, item) in enumerate(zip(actual, expected, strict=True)):
        confidence_delta = abs(float(item["confidence"]) - observed["confidence"])
        if item["true"] != observed["true"] or item["pred"] != observed["pred"] or confidence_delta > 1e-4:
            print(
                "scratch checkpoint does not match results.json at "
                f"miss_{index:03d}: expected {item['true']}->{item['pred']} "
                f"{float(item['confidence']):.6f}, got {observed['true']}->{observed['pred']} "
                f"{observed['confidence']:.6f}"
            )
            return False

    target_dir = args.misclass_out / "scratch"
    target_dir.mkdir(parents=True, exist_ok=True)
    for old in target_dir.glob("miss_*.png"):
        old.unlink()
    for index, (observed, item) in enumerate(zip(actual, expected, strict=True)):
        filename = item.get("image_path") or f"miss_{index:03d}.png"
        observed["image"].resize((96, 96), resample=0).save(target_dir / filename)

    print(f"exported {len(actual)} real scratch misclassification images")
    return True


def main() -> None:
    args = parse_args()
    if not args.results.exists():
        raise FileNotFoundError(args.results)

    results = json.loads(args.results.read_text(encoding="utf-8"))
    missing = [name for name in RUN_META if name not in results]
    if missing:
        raise ValueError(f"missing result keys: {missing}")

    scratch_images = export_scratch_misclassification_images(args, results["scratch"])

    args.out.mkdir(parents=True, exist_ok=True)
    for run_id, meta in RUN_META.items():
        include_images = run_id == "scratch" and scratch_images
        run = normalize_run(run_id, results[run_id], args.results, include_images)
        write_json(args.out / meta["filename"], run)

    summary = [summary_row(run_id, results[run_id]) for run_id in RUN_META]
    write_json(args.out / "summary.json", summary)
    print(f"imported real metrics from {args.results}")


if __name__ == "__main__":
    main()
