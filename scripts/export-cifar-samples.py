#!/usr/bin/env python3
"""Export real CIFAR-10 thumbnails for Step 1.

The frontend expects:
  - public/data/cifar-samples.bin as 100 images in uint8 CHW order
  - public/data/cifar-samples-labels.json with one label record per image
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torchvision


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=ROOT / "data")
    parser.add_argument("--out", type=Path, default=PUBLIC / "data")
    parser.add_argument("--split", choices=["train", "test"], default="test")
    parser.add_argument("--per-class", type=int, default=10)
    parser.add_argument("--download", action="store_true", help="Download CIFAR-10 if the local cache is missing.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dataset = torchvision.datasets.CIFAR10(
        root=args.data_root,
        train=args.split == "train",
        download=args.download,
        transform=None,
    )
    class_names = list(dataset.classes)
    selected: list[tuple[int, int]] = []

    for class_index, class_name in enumerate(class_names):
        found = 0
        for dataset_index, label in enumerate(dataset.targets):
            if label != class_index:
                continue
            selected.append((dataset_index, label))
            found += 1
            if found == args.per_class:
                break
        if found < args.per_class:
            raise RuntimeError(f"only found {found} samples for {class_name}")

    raw = np.zeros((len(selected), 3, 32, 32), dtype=np.uint8)
    labels = []
    for output_index, (dataset_index, label) in enumerate(selected):
        image, _ = dataset[dataset_index]
        array = np.asarray(image, dtype=np.uint8)
        raw[output_index] = array.transpose(2, 0, 1)
        class_name = class_names[label]
        labels.append({
            "label": int(label),
            "className": class_name,
            "filename": f"cifar10-{args.split}-{dataset_index:05d}-{class_name}.png",
            "source": "torchvision.datasets.CIFAR10",
            "sourceIndex": int(dataset_index),
            "split": args.split,
        })

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "cifar-samples.bin").write_bytes(raw.tobytes())
    (args.out / "cifar-samples-labels.json").write_text(
        json.dumps(labels, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"exported {len(selected)} real CIFAR-10 {args.split} samples to {args.out}")


if __name__ == "__main__":
    main()
