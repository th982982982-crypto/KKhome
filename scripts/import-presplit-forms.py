#!/usr/bin/env python3
# Nhập biểu mẫu đã tách sẵn thành từng file riêng (không tách từ text văn bản cha).
# Nguồn: "Tổng hợp 2/<folder>/Mau so <code>. <title>.doc(x)" hoặc "Phu luc <n>. <title>.doc(x)"
# Đích: "Biểu mẫu xuất/Biểu mẫu <SHORT>/<code>.docx" + merge scripts/forms-manifest.json.
import os, re, json, shutil, subprocess, unicodedata
import docx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC2 = os.path.join(ROOT, 'Tổng hợp 2')
OUT = os.path.join(ROOT, 'Biểu mẫu xuất')
DOC_CACHE = os.path.join(ROOT, 'scripts', '.doc-cache')
MANIFEST_PATH = os.path.join(ROOT, 'scripts/forms-manifest.json')

# slug -> (tên folder trong "Tổng hợp 2", tên ngắn dùng cho "Biểu mẫu <short>")
FOLDERS = {
    'nd126': ('Nghị-định-126-2020-NĐ-CP-20260707153714', 'ND126'),
    'tt80': ('Thông-tư-80-2021-TT-BTC-20260707150225', 'TT80'),
}

FNAME_RE = re.compile(r'^(Mau so|Phu luc)\s+(.*)$', re.IGNORECASE)


def ascii_fold(s):
    # Supabase Storage key chỉ chấp nhận ASCII → bỏ dấu, Đ/đ -> D/d
    s = s.replace('Đ', 'D').replace('đ', 'd')
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def norm_code(raw):
    c = ascii_fold(raw.strip().rstrip('.'))
    c = c.replace('/', '-').replace('_', '-').replace(' ', '-')
    c = re.sub(r'-{2,}', '-', c)
    c = re.sub(r'[^0-9A-Za-z\-]', '', c)
    return c.strip('-') or 'MAU'


def parse_fname(stem):
    """'Mau so 01_ADT. Tieu de' -> ('01-ADT', 'mau'); 'Phu luc I. Tieu de' -> ('PL-I', 'pl')."""
    m = FNAME_RE.match(stem)
    if not m:
        return None
    kind, rest = m.group(1).lower(), m.group(2)
    dot = rest.find('.')
    if dot < 0:
        return None
    code_part = rest[:dot]
    if kind == 'phu luc':
        return 'PL-' + norm_code(code_part)
    return norm_code(code_part)


def ensure_docx(path):
    if path.lower().endswith('.docx'):
        return path
    os.makedirs(DOC_CACHE, exist_ok=True)
    out = os.path.join(DOC_CACHE, os.path.splitext(os.path.basename(path))[0] + '.docx')
    if not os.path.exists(out):
        subprocess.run(['textutil', '-convert', 'docx', '-output', out, path], check=True)
    return out


SKIP_PREFIXES = (
    "mẫu số", "phụ lục", "(ban hành", "ban hành", "số:", "quyển số",
    "đơn vị", "địa chỉ", "bộ phận", "mã qhns", "kèm theo", "nợ:", "có:",
)


def is_caps(t):
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and all(not c.islower() for c in letters)


def extract_title(path):
    try:
        d = docx.Document(path)
    except Exception:
        return None
    lines = []
    for p in d.paragraphs:
        for raw in p.text.split('\n'):
            t = raw.strip()
            if t:
                lines.append(t)
        if len(lines) > 40:
            break
    candidates = [t for t in lines if not t.lower().startswith(SKIP_PREFIXES)]
    for t in candidates:
        if is_caps(t) and 4 <= len(t) <= 200:
            return t
    for t in candidates:
        if 4 <= len(t) <= 200:
            return t
    return None


def run():
    manifest = {}
    if os.path.exists(MANIFEST_PATH):
        manifest = json.load(open(MANIFEST_PATH, encoding='utf-8'))
    print("Nhập biểu mẫu tách sẵn...")
    total = 0
    for slug, (folder, short) in FOLDERS.items():
        src_dir = os.path.join(SRC2, folder)
        dword = os.path.join(OUT, f'Biểu mẫu {short}')
        shutil.rmtree(dword, ignore_errors=True)
        os.makedirs(dword, exist_ok=True)
        seen = {}
        entries = []
        for fname in sorted(os.listdir(src_dir)):
            stem, ext = os.path.splitext(fname)
            if ext.lower() not in ('.doc', '.docx'):
                continue
            code = parse_fname(stem)
            if not code:
                print(f"  ⚠️ {slug}: không parse được tên file: {fname}")
                continue
            if code in seen:
                seen[code] += 1
                code = f"{code}-{seen[code]}"
            else:
                seen[code] = 1
            docx_path = ensure_docx(os.path.join(src_dir, fname))
            out_path = os.path.join(dword, code + '.docx')
            shutil.copy(docx_path, out_path)
            title = extract_title(out_path) or code
            entries.append({'code': code, 'title': title, 'pl': '', 'note': ''})
        manifest[slug] = entries
        total += len(entries)
        print(f"  {slug:7} ({folder}) -> {len(entries)} mẫu")
    json.dump(manifest, open(MANIFEST_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Tổng: {total} mẫu. Manifest: scripts/forms-manifest.json")


if __name__ == '__main__':
    run()
