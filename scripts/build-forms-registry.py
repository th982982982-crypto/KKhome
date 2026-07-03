#!/usr/bin/env python3
"""Sinh danh mục biểu mẫu cho 8 văn bản (ngoài TT99) từ thư mục "Biểu mẫu xuất".

- code  = tên file (bỏ .docx)
- title = ưu tiên tiêu đề trong scripts/forms-manifest.json; nếu không có thì
          trích từ nội dung .docx (dòng IN HOA đầu tiên); fallback = code.

Đầu ra: src/lib/legal/forms-extra.json  ->  { "<slug>": [ {code, title}, ... ] }
TT99 vẫn dùng src/lib/legal/tt99-forms.ts (đã có sẵn), không xử lý ở đây.

Chạy: python3 scripts/build-forms-registry.py
"""
import json
import os
import sys

try:
    import docx  # python-docx
except ImportError:
    docx = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMS_DIR = os.path.join(ROOT, "Biểu mẫu xuất")
MANIFEST = os.path.join(ROOT, "scripts", "forms-manifest.json")
OUT = os.path.join(ROOT, "src", "lib", "legal", "forms-extra.json")

# Tên thư mục (Word) -> slug văn bản
FOLDER_TO_SLUG = {
    "Biểu mẫu TT133": "tt133",
    "Biểu mẫu TT152": "tt152",
    "Biểu mẫu TT58": "tt58",
    "Biểu mẫu TT18": "tt18",
    "Biểu mẫu TT69": "tt69",
    "Biểu mẫu TT158": "tt158",
    "Biểu mẫu TT20": "tt20",
    "Biểu mẫu TT06": "tt06",
    "Biểu mẫu NĐ181": "nd181",
    "Biểu mẫu NĐ144": "nd144",
    "Biểu mẫu NĐ132": "nd132",
    "Biểu mẫu NĐ254": "nd254",
}

SKIP_PREFIXES = (
    "mẫu số", "phụ lục", "(ban hành", "ban hành", "số:", "quyển số",
    "đơn vị", "địa chỉ", "bộ phận", "mã qhns", "kèm theo", "nợ:", "có:",
)


def is_caps(t: str) -> bool:
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and all(not c.islower() for c in letters)


def extract_title(path: str):
    if docx is None:
        return None
    try:
        d = docx.Document(path)
    except Exception:
        return None
    lines = []
    for p in d.paragraphs:
        for raw in p.text.split("\n"):
            t = raw.strip()
            if t:
                lines.append(t)
        if len(lines) > 40:
            break
    candidates = [t for t in lines if not t.lower().startswith(SKIP_PREFIXES)]
    # Ưu tiên dòng IN HOA (tiêu đề biểu mẫu thường viết hoa)
    for t in candidates:
        if is_caps(t) and 4 <= len(t) <= 200:
            return t
    # fallback: dòng đầu tiên có nghĩa
    for t in candidates:
        if 4 <= len(t) <= 200:
            return t
    return None


def load_manifest_titles():
    """{(slug, code): title} từ forms-manifest.json."""
    titles = {}
    if not os.path.exists(MANIFEST):
        return titles
    data = json.load(open(MANIFEST, encoding="utf-8"))
    for slug, items in data.items():
        for it in items:
            code = (it.get("code") or "").strip()
            title = (it.get("title") or "").strip()
            if code and title:
                titles[(slug, code)] = title
    return titles


def main():
    if not os.path.isdir(FORMS_DIR):
        print(f"❌ Không thấy thư mục: {FORMS_DIR}", file=sys.stderr)
        sys.exit(1)

    manifest_titles = load_manifest_titles()
    out = {}
    total = 0

    for folder, slug in FOLDER_TO_SLUG.items():
        word_dir = os.path.join(FORMS_DIR, folder)
        if not os.path.isdir(word_dir):
            print(f"⚠️  bỏ qua (không có thư mục): {folder}", file=sys.stderr)
            continue
        forms = []
        for fname in sorted(os.listdir(word_dir)):
            if not fname.lower().endswith(".docx") or fname.startswith("~"):
                continue
            code = os.path.splitext(fname)[0]
            title = (
                manifest_titles.get((slug, code))
                or extract_title(os.path.join(word_dir, fname))
                or code
            )
            forms.append({"code": code, "title": title})
        out[slug] = forms
        total += len(forms)
        print(f"  {slug:7s} {len(forms):3d} biểu mẫu  ({folder})")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"✅ {total} biểu mẫu / {len(out)} văn bản -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
