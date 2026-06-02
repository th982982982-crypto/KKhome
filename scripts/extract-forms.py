#!/usr/bin/env python3
# Trích biểu mẫu từ các .docx trong "Tổng hợp" -> file DOC (giữ định dạng gốc) + Excel.
# Mỗi "Mẫu số" = 1 file; VB dùng "Phụ lục" (không mã) -> tách theo Phụ lục.
# Ghi manifest scripts/forms-manifest.json để generator nhúng D.forms.
import os, re, json, shutil, unicodedata
from docx import Document
from docx.oxml.ns import qn
import openpyxl
from openpyxl.styles import Font, Alignment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'Tổng hợp')
OUT  = os.path.join(ROOT, 'Biểu mẫu xuất')

# slug -> (docx file, tên thư mục ngắn)
FORM_DOCS = {
 'tt18' : ('Thông-tư-18-2026-TT-BTC.docx', 'TT18'),
 'tt69' : ('Thông-tư-69-2025-TT-BTC.docx', 'TT69'),
 'tt158': ('Thông-tư-158-2025-TT-BTC.docx', 'TT158'),
 'nd360': ('Nghị-định-360-2025-NĐ-CP.docx', 'NĐ360'),
 'nd181': ('Nghị-định-181-2025-NĐ-CP.docx', 'NĐ181'),
 'nd144': ('Nghị-định-144-2026-NĐ-CP.docx', 'NĐ144'),
}

P, TBL = qn('w:p'), qn('w:tbl')
MAU = re.compile(r'M[aẫ]u\s*s[ốo]\s*[:\.]?\s*([0-9][0-9A-Za-zĐĐđ\-\./]*)')
PL  = re.compile(r'^\s*(PHỤ LỤC|Phụ lục)\b[^\n]{0,60}')

def btext(el):
    return ''.join(t.text or '' for t in el.iter(qn('w:t')))

def blocks_of(doc):
    return [c for c in doc.element.body.iterchildren() if c.tag in (P, TBL)]

def ascii_fold(s):
    # Supabase Storage key chỉ chấp nhận ASCII → bỏ dấu, Đ/đ -> D/d
    s = s.replace('Đ', 'D').replace('đ', 'd')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s

def norm_code(raw):
    c = ascii_fold(raw.strip().rstrip('.')).replace('/', '-').replace(' ', '')
    c = re.sub(r'[^0-9A-Za-z\-]', '', c)
    return c or 'MAU'

def is_title(t):
    t = t.strip()
    if len(t) < 6 or len(t) > 120: return False
    if re.match(r'(Mẫu số|Phụ lục|\(?Kèm theo|PHỤ LỤC)', t): return False
    letters = [c for c in t if c.isalpha()]
    if not letters: return False
    upper = sum(1 for c in letters if c == c.upper())
    return upper / len(letters) > 0.8

def detect_forms(blocks):
    """Trả về list (code, title, pl, start_idx, end_idx)."""
    # anchor chính: block có 'Mẫu số <code>' + 'Kèm theo'
    anchors = []
    for i, c in enumerate(blocks):
        t = btext(c)
        m = MAU.search(t)
        if m and 'Kèm theo' in t:
            anchors.append((i, norm_code(m.group(1)), 'mau'))
    mode = 'mau'
    if not anchors:
        # fallback: tách theo Phụ lục (paragraph)
        for i, c in enumerate(blocks):
            if c.tag == P and PL.match(btext(c)):
                anchors.append((i, None, 'pl'))
        mode = 'pl'
    forms = []
    for k, (idx, code, kind) in enumerate(anchors):
        end = anchors[k + 1][0] if k + 1 < len(anchors) else len(blocks)
        # title = dòng in hoa đầu tiên trong phạm vi
        title = ''
        for j in range(idx, end):
            if blocks[j].tag == P:
                tt = btext(blocks[j]).strip()
                if is_title(tt):
                    title = re.sub(r'\s+', ' ', tt)[:120]; break
        pl = ''
        if kind == 'pl':
            pl_txt = re.sub(r'\s+', ' ', btext(blocks[idx]).strip())[:60]
            code = norm_code('PL%d' % (k + 1))
            pl = pl_txt
            if not title: title = pl_txt
        forms.append((code, title or code, pl, idx, end))
    return forms, mode

def write_docx(src_path, out_path, start, end):
    shutil.copy(src_path, out_path)
    doc = Document(out_path)
    bl = blocks_of(doc)
    for i, c in enumerate(bl):
        if i < start or i >= end:
            c.getparent().remove(c)
    doc.save(out_path)

def write_xlsx(doc, out_path, start, end, title):
    bl = blocks_of(doc)
    wb = openpyxl.Workbook(); ws = wb.active
    ws.title = (re.sub(r'[/\\?*\[\]:]', '-', title)[:28] or 'Mẫu')
    ws.column_dimensions['A'].width = 60
    r = 1
    for i in range(start, end):
        el = bl[i]
        if el.tag == P:
            t = btext(el).strip()
            if t:
                ws.cell(row=r, column=1, value=t); r += 1
        else:  # table
            for tr in el.findall(qn('w:tr')):
                cells = tr.findall(qn('w:tc'))
                for ci, tc in enumerate(cells):
                    txt = '\n'.join(p_t for p_t in (btext(p).strip() for p in tc.findall(qn('w:p'))) if p_t)
                    ws.cell(row=r, column=ci + 1, value=txt)
                r += 1
    wb.save(out_path)

def run():
    print("Trích biểu mẫu...")
    manifest = {}
    total = 0
    for slug, (fn, short) in FORM_DOCS.items():
        src = os.path.join(SRC, fn)
        doc = Document(src)
        bl = blocks_of(doc)
        forms, mode = detect_forms(bl)
        if not forms:
            print(f"  {slug:7} (0 mẫu) — không phát hiện ranh giới"); continue
        dword = os.path.join(OUT, f'Biểu mẫu {short}')
        dxls  = os.path.join(OUT, f'Biểu mẫu {short} (Excel)')
        shutil.rmtree(dword, ignore_errors=True); shutil.rmtree(dxls, ignore_errors=True)
        os.makedirs(dword, exist_ok=True); os.makedirs(dxls, exist_ok=True)
        seen = {}; entries = []
        for code, title, pl, s, e in forms:
            if code in seen:
                seen[code] += 1; code = f"{code}-{seen[code]}"
            else:
                seen[code] = 1
            write_docx(src, os.path.join(dword, code + '.docx'), s, e)
            write_xlsx(doc, os.path.join(dxls, code + '.xlsx'), s, e, title)
            entries.append({'code': code, 'title': title, 'pl': pl, 'note': ''})
        manifest[slug] = entries
        total += len(entries)
        print(f"  {slug:7} ({mode}) -> {len(entries)} mẫu : {', '.join(x['code'] for x in entries[:6])}{' …' if len(entries)>6 else ''}")
    json.dump(manifest, open(os.path.join(ROOT, 'scripts/forms-manifest.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=2)
    print(f"Tổng: {total} mẫu × (DOC+Excel). Manifest: scripts/forms-manifest.json")

if __name__ == '__main__':
    run()
