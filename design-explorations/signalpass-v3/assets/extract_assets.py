#!/usr/bin/env python3
"""Rebuild deterministic V3 crops and the asset manifest (Pillow only).

ImageGen is not invoked here. Its accepted source PNGs are retained separately.
All crop coordinates use the original 1672 x 941 reference images.
"""

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT.parent

# output, source screen, x, y, width, height, role, transform
CROPS = [
    ("avatars/alex-profile.png", 1, 1076, 232, 138, 138, "avatar", "circle"),
    ("avatars/alex-intro.png", 1, 1076, 232, 138, 138, "avatar-alias", "circle"),
    ("avatars/maya-card.png", 3, 492, 444, 132, 132, "avatar", "circle"),
    ("avatars/rohan-card.png", 3, 789, 444, 132, 132, "avatar", "circle"),
    ("avatars/leo-card.png", 3, 1104, 444, 132, 132, "avatar", "circle"),
    ("avatars/alex-widget.png", 4, 195, 335, 145, 145, "selected-avatar-reference", "none"),
    ("avatars/rohan-widget.png", 4, 350, 335, 145, 145, "avatar", "circle"),
    ("avatars/maya-widget.png", 4, 505, 335, 145, 145, "avatar", "circle"),
    ("avatars/alex-inbox.png", 6, 238, 345, 65, 65, "avatar-low-resolution", "circle"),
    ("avatars/sam-inbox.png", 6, 238, 439, 65, 65, "avatar-low-resolution", "circle"),
    ("avatars/jordan-inbox.png", 6, 238, 530, 65, 65, "avatar-low-resolution", "circle"),
    ("avatars/taylor-inbox.png", 6, 238, 658, 65, 65, "avatar-low-resolution", "circle"),
    ("avatars/priya-inbox.png", 6, 238, 785, 65, 65, "avatar-low-resolution", "circle"),
    ("textures/paper-grain-reference.png", 1, 700, 20, 256, 80, "texture-swatch", "none"),
    ("textures/logo-reference.png", 3, 30, 15, 280, 75, "reference-only", "none"),
    ("textures/mountain-left-reference.png", 3, 0, 700, 350, 235, "placement-bound-collage", "none"),
    ("textures/mountain-right-reference.png", 6, 1360, 160, 312, 370, "placement-bound-collage", "none"),
    ("textures/plants-crates-reference.png", 2, 0, 570, 360, 350, "reference-only", "none"),
    ("textures/purple-tape-reference.png", 3, 1520, 500, 150, 220, "reference-only", "none"),
    ("references/components/profile-source-import.png", 1, 610, 120, 420, 690, "reference-only", "none"),
    ("references/components/profile-draft.png", 1, 1050, 120, 525, 690, "reference-only", "none"),
    ("references/components/alex-seated-source.png", 1, 280, 270, 300, 315, "reference-only", "none"),
    ("personas/alex-seated-source.png", 3, 265, 414, 205, 505, "reference-only", "none"),
    ("references/components/public-profile-visibility.png", 2, 425, 225, 650, 300, "reference-only", "none"),
    ("references/components/agent-matching.png", 2, 1080, 220, 460, 305, "reference-only", "none"),
    ("references/components/interests-curiosities.png", 2, 425, 525, 650, 215, "reference-only", "none"),
    ("references/components/allowed-data-sources.png", 2, 1080, 525, 470, 265, "reference-only", "none"),
    ("references/components/alex-standing-source.png", 2, 105, 180, 300, 700, "reference-only", "none"),
    ("references/components/discovery-query.png", 3, 450, 110, 900, 270, "reference-only", "none"),
    ("references/components/discovery-results.png", 3, 470, 420, 920, 385, "reference-only", "none"),
    ("references/components/rohan-standing-source.png", 3, 1380, 220, 280, 690, "reference-only", "none"),
    ("references/components/widget-editor.png", 4, 165, 280, 650, 610, "reference-only", "none"),
    ("references/components/widget-preview.png", 4, 855, 270, 690, 400, "reference-only", "none"),
    ("references/components/widget-embed.png", 4, 855, 705, 690, 120, "reference-only", "none"),
    ("references/components/introduction-agent-panel.png", 5, 240, 225, 620, 690, "reference-only", "none"),
    ("references/components/introduction-card.png", 5, 870, 205, 560, 700, "reference-only", "none"),
    ("references/components/alex-intro-source.png", 5, 235, 275, 270, 320, "reference-only", "none"),
    ("references/components/recipient-list.png", 6, 175, 270, 560, 650, "reference-only", "none"),
    ("references/components/recipient-detail.png", 6, 755, 100, 670, 800, "reference-only", "none"),
    ("references/components/button-primary-review.png", 1, 840, 805, 285, 65, "css-reference", "none"),
    ("references/components/button-secondary-manual.png", 1, 1145, 805, 275, 65, "css-reference", "none"),
    ("references/components/button-primary-settings.png", 2, 1234, 792, 211, 61, "css-reference", "none"),
    ("references/components/button-secondary-preview.png", 2, 1025, 790, 215, 65, "css-reference", "none"),
    ("references/components/button-primary-ask-agent.png", 3, 1050, 280, 255, 65, "css-reference", "none"),
    ("references/components/button-primary-copy-embed.png", 4, 865, 790, 315, 65, "css-reference", "none"),
    ("references/components/button-secondary-preview-site.png", 4, 1185, 790, 315, 65, "css-reference", "none"),
    ("references/components/button-primary-approve-send.png", 5, 950, 791, 430, 54, "css-reference", "none"),
    ("references/components/button-primary-accept.png", 6, 785, 800, 220, 65, "css-reference", "none"),
    ("references/components/button-secondary-ask-context.png", 6, 1005, 800, 210, 65, "css-reference", "none"),
    ("references/components/button-danger-decline.png", 6, 1215, 800, 205, 65, "css-reference", "none"),
]

SCREEN_NAMES = {
    1: "01-profile-source-import.png", 2: "02-personal-agent-privacy.png",
    3: "03-people-discovery.png", 4: "04-profile-widget.png",
    5: "05-introduction-composer.png", 6: "06-recipient-inbox.png",
}


def clean_alpha(path, output):
    """Remove disconnected ImageGen alpha specks, preserving subject RGB."""
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    width, height = image.size
    alpha_pixels = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
    mask = bytearray(1 if value >= 32 else 0 for value in alpha_pixels)
    largest = []
    for start in range(len(mask)):
        if not mask[start]:
            continue
        mask[start] = 0
        queue, component = deque([start]), []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        neighbor = ny * width + nx
                        if mask[neighbor]:
                            mask[neighbor] = 0
                            queue.append(neighbor)
        if len(component) > len(largest):
            largest = component
    kept = bytearray(width * height)
    for index in largest:
        kept[index] = 255
    subject = Image.frombytes("L", image.size, bytes(kept)).filter(ImageFilter.MaxFilter(5))
    image.putalpha(ImageChops.multiply(alpha, subject))
    bounds = image.getchannel("A").getbbox()
    image = image.crop(bounds)
    image.save(output)
    return bounds


def main():
    manifest = {"schema_version": 1, "source_viewport": [1672, 941], "assets": []}
    cache = {number: Image.open(SOURCES / name).convert("RGBA") for number, name in SCREEN_NAMES.items()}
    for output, source, x, y, width, height, role, transform in CROPS:
        target = ROOT / output
        target.parent.mkdir(parents=True, exist_ok=True)
        cropped = cache[source].crop((x, y, x + width, y + height))
        if transform == "circle":
            alpha = Image.new("L", cropped.size)
            ImageDraw.Draw(alpha).ellipse((0, 0, width - 1, height - 1), fill=255)
            cropped.putalpha(alpha)
        cropped.save(target)
        manifest["assets"].append({"file": output, "source": SCREEN_NAMES[source], "crop_xywh": [x, y, width, height], "role": role, "method": "source-pixel-crop", "transform": transform})

    for persona in ("alex", "rohan"):
        source = ROOT / "personas" / f"{persona}-standing-imagegen.png"
        target = ROOT / "personas" / f"{persona}-standing.png"
        bounds = clean_alpha(source, target)
        manifest["assets"].append({"file": str(target.relative_to(ROOT)), "source": str(source.relative_to(ROOT)), "role": "reusable-raster", "method": "built-in-imagegen-plus-alpha-speck-cleanup", "trim_ltrb": bounds, "fidelity": "style/identity reference reconstruction; not a pixel-preserving crop"})

    known = {entry["file"] for entry in manifest["assets"]}
    for path in sorted(ROOT.rglob("*.png")):
        name = str(path.relative_to(ROOT))
        if name not in known and name != "contact-sheet.png":
            manifest["assets"].append({"file": name, "role": "reference-only", "method": "retained-reference"})
    for entry in manifest["assets"]:
        image = Image.open(ROOT / entry["file"])
        entry["size"] = list(image.size)
        entry["has_alpha"] = "A" in image.getbands()
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    entries = [entry for entry in manifest["assets"] if "imagegen-experiments" not in entry["file"]]
    cell_w, cell_h, columns = 280, 245, 4
    sheet = Image.new("RGB", (columns * cell_w, ((len(entries) + columns - 1) // columns) * cell_h), "#f4ecdf")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, entry in enumerate(entries):
        x, y = (index % columns) * cell_w, (index // columns) * cell_h
        image = Image.open(ROOT / entry["file"]).convert("RGBA")
        image.thumbnail((250, 202))
        sheet.paste(image, (x + (cell_w - image.width) // 2, y + 8), image)
        label = entry["file"].split("/")[-1]
        draw.text((x + 10, y + 214), label, fill="#101433", font=font)
    sheet.save(ROOT / "contact-sheet.png")
    print(f"Wrote {len(manifest['assets'])} manifest entries; source crops and alpha checks complete.")


if __name__ == "__main__":
    main()
