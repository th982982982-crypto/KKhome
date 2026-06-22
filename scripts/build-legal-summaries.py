#!/usr/bin/env python3
# Thêm tab "📋 Tóm tắt" (theo từng Điều) + đổi "Nội dung" → "Nguyên bản" cho mọi văn bản.
# Idempotent — chạy lại an toàn. Chạy SAU build-legal-crossrefs.py.
# Nguồn dữ liệu tóm tắt: src/lib/legal/summaries.json (slug -> articleId -> {tldr, points[]}).
import json, re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'src/legal-docs')
SUMMARIES = json.load(open(os.path.join(ROOT, 'src/lib/legal/summaries.json'), encoding='utf-8'))

SUM_CSS = '''/*SUM-CSS-START*/
#s-summary{padding:0}
.sum-wrap{max-width:880px;margin:0 auto;padding:22px 20px 60px}
.sum-h1{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px}
.sum-scope{color:#475569;font-size:14px;line-height:1.6;margin:0 0 14px}
.sum-grid{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.sum-stat{background:#f1f5f9;border-radius:10px;padding:8px 14px;text-align:center;min-width:80px}
.sum-stat b{display:block;font-size:18px;color:#2563eb}
.sum-stat span{font-size:11px;color:#64748b}
.sum-rel{margin-bottom:18px}
.sum-tag{display:inline-block;background:#eff6ff;color:#2563eb;border-radius:999px;padding:3px 10px;font-size:12px;margin:0 6px 6px 0}
.sum-ch{font-weight:800;color:#1e40af;font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin:20px 0 8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}
.sum-mu{font-weight:700;color:#475569;font-size:13px;margin:12px 0 6px}
.sum-art{background:#fff;border:1px solid #e8edf3;border-radius:12px;padding:13px 15px;margin-bottom:10px}
.sum-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.sum-code{font-weight:800;color:#0f172a;font-size:14px}
.sum-title{color:#334155;font-size:14px;flex:1}
.sum-go{color:#2563eb;font-size:12px;cursor:pointer;text-decoration:none;white-space:nowrap}
.sum-go:hover{text-decoration:underline}
.sum-tldr{color:#1f2937;font-size:14px;line-height:1.65;margin:0 0 6px}
.sum-pts{margin:6px 0 0;padding-left:18px}
.sum-pts li{color:#374151;font-size:13.5px;line-height:1.6;margin-bottom:3px}
.sum-empty{color:#94a3b8;font-style:italic;font-size:13px;margin:0}
/*SUM-CSS-END*/
'''

# JS dùng e() (đã có sẵn trong template generator), show() để mở Nguyên bản.
SUM_JS = '''/*SUM-JS-START*/
function summaryHtml(s){
  if(!s||(!s.tldr&&!(s.points&&s.points.length)))return '<p class="sum-empty">— Chưa có tóm tắt —</p>';
  var h='';
  if(s.tldr)h+='<p class="sum-tldr">'+e(s.tldr)+'</p>';
  if(s.points&&s.points.length){h+='<ul class="sum-pts">';s.points.forEach(function(p){h+='<li>'+e(p)+'</li>'});h+='</ul>';}
  return h;
}
function buildSummary(){
  var m=D.meta||{},o=D.outline||[],sm=D.summaries||{};
  var chs={};o.forEach(function(a){if(a.chuong)chs[a.chuong]=1});
  var h='<div class="sum-wrap"><h1 class="sum-h1">'+e(m.title||'')+'</h1>';
  if(m.scope)h+='<p class="sum-scope">'+e(m.scope)+'</p>';
  h+='<div class="sum-grid"><div class="sum-stat"><b>'+o.length+'</b><span>Điều</span></div><div class="sum-stat"><b>'+Object.keys(chs).length+'</b><span>Chương</span></div>'+(m.effectiveDate?'<div class="sum-stat"><b>'+e(m.effectiveDate)+'</b><span>Hiệu lực</span></div>':'')+'</div>';
  if(m.related&&m.related.length){h+='<div class="sum-rel">';m.related.forEach(function(r){h+='<span class="sum-tag">'+e(r)+'</span>'});h+='</div>';}
  var lastC='',lastM='';
  o.forEach(function(a){
    if((a.chuong||'')!==lastC){lastC=a.chuong||'';lastM='';if(lastC)h+='<div class="sum-ch">'+e(lastC)+'</div>';}
    if((a.muc||'')!==lastM){lastM=a.muc||'';if(lastM)h+='<div class="sum-mu">'+e(lastM)+'</div>';}
    h+='<div class="sum-art" id="sum-'+a.id+'"><div class="sum-head"><span class="sum-code">'+e(a.code)+'</span>'+(a.shortTitle?'<span class="sum-title">'+e(a.shortTitle)+'</span>':'')+'<a class="sum-go" onclick="goOriginal(\\''+a.id+'\\');return false">Xem nguyên bản →</a></div>'+summaryHtml(sm[a.id])+'</div>';
  });
  h+='</div>';
  document.getElementById('s-summary').innerHTML=h;
}
function goOriginal(id){show(id);}
/*SUM-JS-END*/
'''

# --- mỏ neo cố định trong template generator (đã xác minh khớp 34 doc) ---
A_TAB_MAIN = '<button class="tab on" id="tab-main" onclick="tab(\'main\',this)">📖 Nội dung</button>'
A_TAB_HOME = '<button class="tab" id="tab-home" onclick="tab(\'home\',this)">🏛️ Tổng quan</button>'
A_SMAIN    = '<div class="sec on" id="s-main">'
A_SHOME    = '<div class="sec" id="s-home"></div>'
A_TABFN    = "if(t==='home')buildHome();"
A_INIT     = "  buildSb('');\n  if(ok)show(id);else if((D.outline||[]).length)show(D.outline[0].id);"

NEW_TAB_BAR = ('<!--SUM-TAB-START--><button class="tab on" id="tab-summary" onclick="tab(\'summary\',this)">📋 Tóm tắt</button><!--SUM-TAB-END-->'
               '<button class="tab" id="tab-main" onclick="tab(\'main\',this)">📖 Nguyên bản</button>')
NEW_SHOME   = '<div class="sec on" id="s-summary"></div>'
NEW_TABFN   = "if(t==='home')buildHome();if(t==='summary')buildSummary();"
# Mặc định: có hash → mở Điều đó (Nguyên bản); không hash & CÓ tóm tắt → ở Tóm tắt;
# không hash & CHƯA có tóm tắt → mở Điều đầu (Nguyên bản) để không hiện tab trống.
NEW_INIT    = ("  buildSb('');buildSummary();\n"
               "  if(ok)show(id);else if(!D.summaries||!Object.keys(D.summaries).length){if((D.outline||[]).length)show(D.outline[0].id);}")

def set_summaries_in_json(c, slug):
    m = re.search(r'(<script id="(?:LD|DATA)" type="application/json">)(.*?)(</script>)', c, re.DOTALL)
    if not m: return c, 0
    data = json.loads(m.group(2))
    data['summaries'] = SUMMARIES.get(slug, {})
    nj = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    return c[:m.start(2)] + nj + c[m.end(2):], len(data['summaries'])

def strip_sum_blocks(c):
    c = re.sub(r'/\*SUM-CSS-START\*/.*?/\*SUM-CSS-END\*/\n?', '', c, flags=re.DOTALL)
    c = re.sub(r'/\*SUM-JS-START\*/.*?/\*SUM-JS-END\*/\n?', '', c, flags=re.DOTALL)
    return c

def patch_generator(slug):
    p = os.path.join(DOCS, slug, 'index.html')
    c = open(p, encoding='utf-8').read()
    c = strip_sum_blocks(c)
    c, ncnt = set_summaries_in_json(c, slug)
    # CSS
    c = c.replace('</style>', SUM_CSS + '</style>', 1)
    # JS funcs trước initHash
    c = c.replace('function initHash(', SUM_JS + 'function initHash(', 1)
    # Tab bar: chèn Tóm tắt + đổi Nội dung→Nguyên bản (mỏ neo gốc biến mất sau lần đầu → idempotent)
    if A_TAB_MAIN in c:
        c = c.replace(A_TAB_MAIN, NEW_TAB_BAR, 1)
    if A_TAB_HOME in c:
        c = c.replace(A_TAB_HOME, '', 1)         # bỏ tab Tổng quan
    # Sections
    if A_SMAIN in c:
        c = c.replace(A_SMAIN, '<div class="sec" id="s-main">', 1)
    if A_SHOME in c:
        c = c.replace(A_SHOME, NEW_SHOME, 1)
    # tab() — thêm nhánh summary (guard tránh nhân đôi)
    if "if(t==='summary')buildSummary();" not in c and A_TABFN in c:
        c = c.replace(A_TABFN, NEW_TABFN, 1)
    # initHash — mặc định Tóm tắt; có hash thì mở Nguyên bản
    if A_INIT in c:
        c = c.replace(A_INIT, NEW_INIT, 1)
    open(p, 'w', encoding='utf-8').write(c)
    print(f"  {slug}: summaries={ncnt} điều, {len(c)//1024}KB")

# ---- Family-B: doc dựng tay nhưng cùng họ JS (show/buildSb/buildHome), nút tab KHÔNG id ----
B_BTN_MAIN = '<button class="tab on" onclick="tab(\'main\',this)">📖 Nội dung</button>'
B_BTN_HOME = '<button class="tab" onclick="tab(\'home\',this)">🏛️ Tổng quan</button>'
B_NEW_BAR  = ('<!--SUM-TAB-START--><button class="tab on" id="tab-summary" onclick="tab(\'summary\',this)">📋 Tóm tắt</button><!--SUM-TAB-END-->'
              '<button class="tab" onclick="tab(\'main\',this)">📖 Nguyên bản</button>')
B_TABFN    = "if(t==='main')buildSb(document.getElementById('q').value);"
B_NEW_TABFN= "if(t==='main')buildSb(document.getElementById('q').value);if(t==='summary')buildSummary();"

def patch_familyB(slug):
    p = os.path.join(DOCS, slug, 'index.html')
    c = open(p, encoding='utf-8').read()
    c = strip_sum_blocks(c)
    c, ncnt = set_summaries_in_json(c, slug)
    c = c.replace('</style>', SUM_CSS + '</style>', 1)
    # JS funcs trước function tab(
    c = c.replace('function tab(', SUM_JS + 'function tab(', 1)
    # Tab bar
    if B_BTN_MAIN in c:
        c = c.replace(B_BTN_MAIN, B_NEW_BAR, 1)
    if B_BTN_HOME in c:
        c = c.replace(B_BTN_HOME, '', 1)
    # Sections (giống generator)
    if A_SMAIN in c:
        c = c.replace(A_SMAIN, '<div class="sec" id="s-main">', 1)
    if A_SHOME in c:
        c = c.replace(A_SHOME, NEW_SHOME, 1)
    # tab() — thêm nhánh summary
    if "if(t==='summary')buildSummary();" not in c and B_TABFN in c:
        c = c.replace(B_TABFN, B_NEW_TABFN, 1)
    # init cuối: bỏ gọi buildHome() (s-home đã đổi) → buildSummary(); mặc định mở Tóm tắt khi không có hash
    if 'buildHome();' in c:
        c = c.replace('buildHome();', 'buildSummary();', 1)
    if 'initHash();' in c and 'SUM-DEFAULT' not in c:
        c = c.replace('initHash();',
                      "/*SUM-DEFAULT*/if(location.hash.slice(1)){initHash();}"
                      "else if(D.summaries&&Object.keys(D.summaries).length){tab('summary',document.getElementById('tab-summary'));}"
                      "else{initHash();}", 1)
    open(p, 'w', encoding='utf-8').write(c)
    print(f"  {slug}: summaries={ncnt} điều (family-B), {len(c)//1024}KB")

FAMILY_B = ['nd320', 'tt133', 'tt152', 'tt20', 'tt58']

def generator_slugs():
    # Generator = có id="tab-main" (bền vững cả trước & sau khi vá) → re-run refresh được dữ liệu.
    out = []
    for p in sorted(glob.glob(os.path.join(DOCS, '*', 'index.html'))):
        c = open(p, encoding='utf-8').read()
        if 'id="tab-main"' in c:
            out.append(os.path.basename(os.path.dirname(p)))
    return out

if __name__ == '__main__':
    print('Thêm tab Tóm tắt cho doc generator...')
    gen = generator_slugs()
    for slug in gen:
        patch_generator(slug)
    print(f'  → {len(gen)} doc generator.')
    print('Thêm tab Tóm tắt cho doc family-B...')
    for slug in FAMILY_B:
        patch_familyB(slug)
    print('Done.')
