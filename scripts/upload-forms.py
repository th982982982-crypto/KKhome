#!/usr/bin/env python3
# Upload các file biểu mẫu đã sinh lên Supabase Storage bucket 'legal-forms'
# theo path <slug>/word/<code>.docx và <slug>/excel/<code>.xlsx (đúng cách /api/legal/forms đọc).
import os, re, json, sys
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, 'Biểu mẫu xuất')
BUCKET = 'legal-forms'

# slug -> tên thư mục ngắn (khớp extract-forms.py)
SHORT = {'tt18': 'TT18', 'tt69': 'TT69', 'tt158': 'TT158', 'nd360': 'NĐ360',
         'nd181': 'NĐ181', 'nd144': 'NĐ144', 'nd132': 'NĐ132', 'nd254': 'NĐ254',
         'nd126': 'ND126', 'tt80': 'TT80',
         'nd255': 'NĐ255', 'nd273': 'NĐ273', 'tt21': 'TT21', 'tt85': 'TT85',
         'tt86': 'TT86', 'tt91': 'TT91', 'tt94': 'TT94', 'tt96': 'TT96'}
MIME = {'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}

def load_env():
    env = {}
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def upload(url, key, path, data, mime):
    ep = f"{url}/storage/v1/object/{BUCKET}/{path}"
    r = requests.post(ep, data=data, headers={
        'Authorization': f'Bearer {key}', 'apikey': key,
        'Content-Type': mime, 'x-upsert': 'true',
    })
    return r.status_code, (r.text[:120] if r.status_code >= 300 else '')

def run():
    env = load_env()
    url = env.get('NEXT_PUBLIC_SUPABASE_URL'); key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local"); sys.exit(1)
    manifest = json.load(open(os.path.join(ROOT, 'scripts/forms-manifest.json'), encoding='utf-8'))
    grand_ok = grand_fail = 0
    for slug, forms in manifest.items():
        short = SHORT.get(slug, slug)
        ok = fail = 0; errs = []
        for f in forms:
            code = f['code']
            for ext, sub in (('docx', 'word'), ('xlsx', 'excel')):
                folder = f"Biểu mẫu {short}" + (' (Excel)' if ext == 'xlsx' else '')
                src = os.path.join(OUT, folder, f"{code}.{ext}")
                if not os.path.exists(src):
                    fail += 1; errs.append(f"missing {src}"); continue
                with open(src, 'rb') as fh:
                    data = fh.read()
                path = f"{slug}/{sub}/{code}.{ext}"
                sc, msg = upload(url, key, path, data, MIME[ext])
                if sc < 300: ok += 1
                else: fail += 1; errs.append(f"{path} -> {sc} {msg}")
        grand_ok += ok; grand_fail += fail
        print(f"  {slug:7} -> upload OK={ok:3} FAIL={fail}" + (f"  | {errs[0]}" if errs else ''))
    print(f"Tổng: OK={grand_ok} FAIL={grand_fail} (bucket '{BUCKET}')")

if __name__ == '__main__':
    run()
