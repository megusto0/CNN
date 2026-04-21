#!/usr/bin/env python3
"""Download and normalize real preset images for the guided tour.

Sources are Wikimedia Commons files with public-domain, CC0, CC BY, or
CC BY-SA licenses. The script writes app-ready square images and a provenance
JSON file for attribution.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
USER_AGENT = "cnn-lab-stand-preset-downloader/1.0"


@dataclass(frozen=True)
class Source:
    key: str
    title: str
    outputs: tuple[tuple[str, int, str], ...]
    pixelate: bool = False


SOURCES = [
    Source(
        key="cat",
        title="File:Tabby cat with blue eyes-3336579.jpg",
        outputs=(
            ("data/transfer-presets/cat.png", 512, "png"),
            ("images/conv-presets/cat.png", 320, "png"),
        ),
    ),
    Source(
        key="dog",
        title="File:Golden Retriever Carlos (10581910556).jpg",
        outputs=(
            ("data/transfer-presets/dog.png", 512, "png"),
            ("images/conv-presets/dog.jpg", 320, "jpeg"),
        ),
    ),
    Source(
        key="car",
        title="File:Dülmen, Wiesmann Sports Cars, Wiesmann Roadster -- 2018 -- 9552-4.jpg",
        outputs=(
            ("data/transfer-presets/car.png", 512, "png"),
            ("data/transfer-presets/automobile.png", 512, "png"),
            ("images/conv-presets/car.jpg", 320, "jpeg"),
        ),
    ),
    Source(
        key="pizza",
        title="File:Pizza 9.jpg",
        outputs=(("data/transfer-presets/pizza.png", 512, "png"),),
    ),
    Source(
        key="ship",
        title="File:Container ship Maersk Surabaya in Fremantle Harbour, July 2021 03.jpg",
        outputs=(("data/transfer-presets/ship.png", 512, "png"),),
    ),
    Source(
        key="ship-cifar-resize",
        title="File:Container ship Maersk Surabaya in Fremantle Harbour, July 2021 03.jpg",
        outputs=(("data/transfer-presets/cifar-resize.png", 512, "png"),),
        pixelate=True,
    ),
    Source(
        key="frog",
        title="File:Red eyed tree frog edit2.jpg",
        outputs=(
            ("data/transfer-presets/frog.png", 512, "png"),
            ("images/conv-presets/frog.jpg", 320, "jpeg"),
        ),
    ),
    Source(
        key="bird",
        title="File:Chipping sparrow (05555).jpg",
        outputs=(("images/conv-presets/bird.jpg", 320, "jpeg"),),
    ),
    Source(
        key="flower",
        title="File:Sunflower head 2015 G1.jpg",
        outputs=(("images/conv-presets/flower.jpg", 320, "jpeg"),),
    ),
    Source(
        key="food",
        title="File:Hamburger (8).jpg",
        outputs=(("images/conv-presets/food.jpg", 320, "jpeg"),),
    ),
    Source(
        key="cameraman",
        title="File:Large-format-camera Tambra.jpg",
        outputs=(("images/conv-presets/cameraman.png", 320, "png"),),
    ),
    Source(
        key="portrait",
        title="File:Vermeer-Portrait of a Young Woman.jpg",
        outputs=(
            ("images/conv-presets/portrait.png", 320, "png"),
            ("images/conv-presets/lena-crop.png", 320, "png"),
        ),
    ),
]


def commons_image_info(title: str) -> dict:
    params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 1600,
    }
    request = Request(
        "https://commons.wikimedia.org/w/api.php?" + urlencode(params),
        headers={"User-Agent": USER_AGENT},
    )
    with urlopen(request, timeout=30) as response:
        data = json.load(response)
    pages = data["query"]["pages"]
    page = next(iter(pages.values()))
    return page["imageinfo"][0]


def download_image(url: str) -> Image.Image:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urlopen(request, timeout=60) as response:
                return Image.open(response).convert("RGB")
        except HTTPError as error:
            if error.code != 429 or attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"failed to download {url}")


def normalize(image: Image.Image, size: int, pixelate: bool) -> Image.Image:
    fitted = ImageOps.fit(image, (size, size), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    if not pixelate:
        return fitted
    low = fitted.resize((32, 32), Image.Resampling.BILINEAR)
    return low.resize((size, size), Image.Resampling.NEAREST)


def save_image(image: Image.Image, rel_path: str, size: int, fmt: str, pixelate: bool) -> None:
    target = PUBLIC / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    normalized = normalize(image, size=size, pixelate=pixelate)
    if fmt == "jpeg":
        normalized.save(target, format="JPEG", quality=90, optimize=True, progressive=True)
    else:
        normalized.save(target, format="PNG", optimize=True)


def write_checker() -> None:
    size = 320
    tile = 20
    image = Image.new("RGB", (size, size), (28, 31, 38))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            bright = ((x // tile) + (y // tile)) % 2 == 0
            pixels[x, y] = (205, 212, 224) if bright else (31, 35, 44)
    target = PUBLIC / "images" / "conv-presets" / "checker.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, format="PNG", optimize=True)


def meta_value(meta: dict, key: str) -> str:
    value = meta.get(key, {}).get("value", "")
    return " ".join(str(value).replace("<span class=\"licensetpl_link\">", "").replace("</span>", "").split())


def main() -> None:
    provenance = []
    for source in SOURCES:
        time.sleep(0.7)
        info = commons_image_info(source.title)
        meta = info.get("extmetadata", {})
        url = info.get("thumburl") or info["url"]
        image = download_image(url)
        for rel_path, size, fmt in source.outputs:
            save_image(image, rel_path, size, fmt, pixelate=source.pixelate)
        provenance.append({
            "key": source.key,
            "title": source.title,
            "page": meta_value(meta, "ObjectName") or source.title,
            "artist": meta_value(meta, "Artist"),
            "license": meta_value(meta, "LicenseShortName"),
            "license_url": meta_value(meta, "LicenseUrl"),
            "source_url": meta_value(meta, "ImageDescription") or info.get("descriptionurl"),
            "download_url": url,
            "outputs": [rel_path for rel_path, _, _ in source.outputs],
            "pixelated_to_32x32_then_upscaled": source.pixelate,
        })
        print(f"downloaded {source.key}: {source.title}")

    write_checker()
    provenance.append({
        "key": "checker",
        "title": "Generated checkerboard",
        "artist": "cnn-lab-stand",
        "license": "Project-generated",
        "outputs": ["images/conv-presets/checker.png"],
    })
    target = PUBLIC / "data" / "preset-image-sources.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(provenance, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
