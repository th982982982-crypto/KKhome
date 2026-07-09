#!/usr/bin/env python3
# Inject article-level cross-references vào các app HTML (idempotent).
# Nguồn: src/lib/legal/cross-refs.json. Chạy lại an toàn nhiều lần.
import json, re, os, html as htmllib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'src/legal-docs')
REFS = json.load(open(os.path.join(ROOT, 'src/lib/legal/cross-refs.json'), encoding='utf-8'))
DETAILS = json.load(open(os.path.join(ROOT, 'src/lib/legal/clause-details.json'), encoding='utf-8'))

def esc(s): return htmllib.escape(s or '')

def css(dark):
    if dark:
        link='#9fc0ff'; hov='#cfe0ff'; head='#9fc0ff'; note='#ffce8a'; bg='rgba(91,140,255,.08)'; bd='rgba(91,140,255,.4)'; sep='rgba(120,140,180,.25)'
    else:
        link='#2563eb'; hov='#1e40af'; head='#2563eb'; note='#b45309'; bg='rgba(37,99,235,.06)'; bd='rgba(37,99,235,.35)'; sep='rgba(120,140,180,.22)'
    return ('/*XREF-CSS-START*/\n'
        f'.xref-in{{color:{link};cursor:pointer;border-bottom:1px dashed {link};text-decoration:none}}\n'
        f'.xref-in:hover{{color:{hov}}}\n'
        f'.refbox{{margin-top:18px;border:1px solid {bd};border-radius:10px;padding:12px 14px;background:{bg}}}\n'
        f'.refhead{{font-size:12px;font-weight:800;color:{head};margin-bottom:6px}}\n'
        f'.refrow{{display:block;padding:7px 0;font-size:13px;color:{link};text-decoration:none;border-top:1px solid {sep}}}\n'
        f'.refrow:first-of-type{{border-top:none}}\n'
        f'.refrow:hover{{color:{hov};padding-left:4px;transition:.12s}}\n'
        f'.refrow.note,.refrow.replaces,.refrow.amendment{{color:{note};font-style:italic;cursor:default}}\n'
        '/*XREF-CSS-END*/\n')

JS_TMPL = r'''/*XREF-JS-START*/
var IDBYNUM={};(D.outline||[]).forEach(function(a){var m=(a.code||"").match(/^Điều\s+(\d+)/);if(m)IDBYNUM[m[1]]=a.id});
function autolink(html){return String(html).replace(/Điều\s+(\d+)/g,function(m,n){return IDBYNUM[n]?'<a class="xref-in" onclick="__NAV__(\''+IDBYNUM[n]+'\');return false">'+m+'</a>':m})}
function renderRefs(id){var rs=(D.refs||{})[id];if(!rs||!rs.length)return "";var h='<div class="refbox"><div class="refhead">🔗 Hướng dẫn / Liên kết liên quan</div>';rs.forEach(function(r){if(r.targetSlug){h+='<a class="refrow '+(r.kind||"")+'" target="_top" href="/legal/'+r.targetSlug+(r.targetAnchor?'?anchor='+r.targetAnchor:'')+'">'+__ESC__(r.label)+' →</a>'}else{h+='<div class="refrow note">'+__ESC__(r.label)+(r.note?" "+__ESC__(r.note):"")+'</div>'}});return h+"</div>"}
/*XREF-JS-END*/
'''
def js_helpers(escaper, nav):
    return JS_TMPL.replace('__NAV__', nav).replace('__ESC__', escaper)

# ---- Clause-level detail (highlight + modal) ----
def cd_css(dark):
    if dark:
        hl='rgba(255,206,138,.16)'; hlb='rgba(255,206,138,.55)'; ico='#ffce8a'
        card='#161d38'; cink='#eef1ff'; ctitle='#9fc0ff'; csum='#c7cef0'
        link='#9fc0ff'; hov='#cfe0ff'; note='#ffce8a'; sep='rgba(120,140,180,.25)'
    else:
        hl='rgba(250,204,21,.22)'; hlb='rgba(202,138,4,.6)'; ico='#2563eb'
        card='#ffffff'; cink='#0f172a'; ctitle='#1e40af'; csum='#1f2937'
        link='#2563eb'; hov='#1e40af'; note='#b45309'; sep='rgba(120,140,180,.22)'
    return ('/*CD-CSS-START*/\n'
        f'.clause-hl{{background:{hl};border-bottom:1px dashed {hlb};border-radius:3px;padding:0 2px;cursor:pointer}}\n'
        f'.clause-hl:hover{{background:{hlb};filter:brightness(1.05)}}\n'
        f'.cd-ico{{font-size:.82em;color:{ico};margin-left:3px;vertical-align:super;font-weight:800;cursor:pointer}}\n'
        '.cd-backdrop{position:fixed;inset:0;background:rgba(8,12,28,.55);display:none;align-items:center;justify-content:center;z-index:99999;padding:18px}\n'
        '.cd-backdrop.show{display:flex}\n'
        f'.cd-card{{background:{card};color:{cink};max-width:560px;width:100%;max-height:84vh;overflow:auto;border-radius:14px;padding:20px 22px;box-shadow:0 24px 64px rgba(0,0,0,.45);position:relative}}\n'
        f'.cd-close{{position:absolute;top:8px;right:12px;border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:{link}}}\n'
        f'.cd-title{{font-size:16px;font-weight:800;margin:0 28px 10px 0;color:{ctitle}}}\n'
        f'.cd-summary{{font-size:14px;line-height:1.6;color:{csum}}}\n'
        '.cd-links{margin-top:14px}\n'
        f'.cd-link{{display:block;padding:9px 0;font-size:13px;color:{link};text-decoration:none;border-top:1px solid {sep}}}\n'
        '.cd-link:first-of-type{border-top:none}\n'
        f'.cd-link:hover{{color:{hov};padding-left:4px;transition:.12s}}\n'
        f'.cd-link.note{{color:{note};font-style:italic}}\n'
        '/*CD-CSS-END*/\n')

JS_CD_TMPL = r'''/*CD-JS-START*/
function __cdData(){return (typeof window!=='undefined'&&window.__CDD__)?window.__CDD__:((typeof D!=='undefined'&&D.details)||{});}
function applyDetails(id,html){var arr=__cdData()[id];if(!arr||!arr.length)return html;for(var ix=0;ix<arr.length;ix++){var e=arr[ix];if(!e||!e.match)continue;var i=html.indexOf(e.match);if(i<0)continue;var pre='<span class="clause-hl" onclick="openDetail(\''+id+'\','+ix+');return false">';html=html.slice(0,i)+pre+html.slice(i,i+e.match.length)+'<span class="cd-ico">ⓘ</span></span>'+html.slice(i+e.match.length);}return html;}
function openDetail(id,ix){var en=(__cdData()[id]||[])[ix];if(!en)return;document.getElementById('cdTitle').textContent=en.title||'';document.getElementById('cdSummary').innerHTML=en.summary||'';var lh='';(en.links||[]).forEach(function(r){if(r.targetSlug){lh+='<a class="cd-link" target="_top" href="/legal/'+r.targetSlug+(r.targetAnchor?'?anchor='+r.targetAnchor:'')+'">'+__ESC__(r.label)+' →</a>'}else{lh+='<div class="cd-link note">'+__ESC__(r.label)+'</div>'}});document.getElementById('cdLinks').innerHTML=lh;document.getElementById('cdBackdrop').classList.add('show');}
function closeDetail(){var b=document.getElementById('cdBackdrop');if(b)b.classList.remove('show');}
if(typeof document!=='undefined')document.addEventListener('keydown',function(ev){if(ev.key==='Escape')closeDetail();});
/*CD-JS-END*/
'''
def cd_js(escaper):
    return JS_CD_TMPL.replace('__ESC__', escaper)

CD_MODAL = ('<!--CD-MODAL-START--><div class="cd-backdrop" id="cdBackdrop" '
    'onclick="if(event.target===this)closeDetail()"><div class="cd-card" role="dialog" aria-modal="true">'
    '<button class="cd-close" onclick="closeDetail()" aria-label="Đóng">×</button>'
    '<div class="cd-title" id="cdTitle"></div><div class="cd-summary" id="cdSummary"></div>'
    '<div class="cd-links" id="cdLinks"></div></div></div><!--CD-MODAL-END-->')

def insert_modal(c):
    if '</body>' in c:
        return c.replace('</body>', CD_MODAL+'\n</body>', 1)
    return c+CD_MODAL

def strip_blocks(c):
    c=re.sub(r'/\*XREF-CSS-START\*/.*?/\*XREF-CSS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'/\*XREF-JS-START\*/.*?/\*XREF-JS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'<!--XREF-START-->.*?<!--XREF-END-->\n?', '', c, flags=re.DOTALL)
    # clause-detail blocks
    c=re.sub(r'/\*CD-CSS-START\*/.*?/\*CD-CSS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'/\*CD-JS-START\*/.*?/\*CD-JS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'<!--CD-MODAL-START-->.*?<!--CD-MODAL-END-->\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'<!--CD-LUAT-JS-START-->.*?<!--CD-LUAT-JS-END-->\n?', '', c, flags=re.DOTALL)
    # unwrap static clause highlights (luat-67) back to plain text
    c=re.sub(r'<span class="clause-hl"[^>]*>(.*?)<span class="cd-ico">[^<]*</span></span>', r'\1', c, flags=re.DOTALL)
    return c

def set_refs_in_json(c, slug):
    m=re.search(r'(<script id="(?:LD|DATA)" type="application/json">)(.*?)(</script>)', c, re.DOTALL)
    if not m: return c, 0
    data=json.loads(m.group(2))
    data['refs']=REFS.get(slug, {})
    data['details']=DETAILS.get(slug, {})
    nj=json.dumps(data, ensure_ascii=False, separators=(',',':'))
    n=sum(len(v) for v in data['refs'].values())
    return c[:m.start(2)]+nj+c[m.end(2):], n

def patch_json_app(slug, dark, escaper, nav, before_func):
    p=os.path.join(DOCS, slug, 'index.html')
    c=open(p, encoding='utf-8').read()
    c=strip_blocks(c)
    c, nrefs=set_refs_in_json(c, slug)
    # CSS before </style>
    c=c.replace('</style>', css(dark)+'</style>', 1)
    # JS helpers before the target function
    c=c.replace(before_func, js_helpers(escaper, nav)+before_func, 1)
    # inline edits (idempotent: original pattern absent if already patched)
    if slug in ('tt58','tt152'):
        c=c.replace("h+='<p>'+t+'</p>';", "h+='<p>'+autolink(t)+'</p>';")
        refs_marker="  h+=renderRefs(id);\n  document.getElementById('av').innerHTML=h;"
        if refs_marker not in c:
            c=c.replace("  document.getElementById('av').innerHTML=h;", refs_marker, 1)
    elif slug in ('tt133','nd320','tt20'):
        c=c.replace("+renderContent(a.content||[],q)+'</div>';",
                    "+renderContent(a.content||[],q)+'</div>'+renderRefs(id);")
        c=c.replace("return h||'<p style=\"color:var(--mut)\">(Mục này không có nội dung văn bản.)</p>';",
                    "return autolink(h||'<p style=\"color:var(--mut)\">(Mục này không có nội dung văn bản.)</p>');")
    elif slug=='tt99':
        c=c.replace("+renderContent(s.content);", "+autolink(renderContent(s.content))+renderRefs(id);")
    # ---- clause-detail: CSS + JS + modal + render hooks ----
    c=c.replace('</style>', cd_css(dark)+'</style>', 1)
    c=c.replace(before_func, cd_js(escaper)+before_func, 1)
    c=insert_modal(c)
    ndet=sum(len(v) for v in DETAILS.get(slug, {}).values())
    if slug in ('tt133','nd320','tt20'):
        c=c.replace("renderContent(a.content||[],q)+'</div>'+renderRefs(id);",
                    "applyDetails(id,renderContent(a.content||[],q))+'</div>'+renderRefs(id);", 1)
    elif slug in ('tt58','tt152'):
        c=c.replace("h+='<p>'+autolink(t)+'</p>';",
                    "h+='<p>'+applyDetails(id,autolink(t))+'</p>';", 1)
    elif slug=='tt99':
        c=c.replace("+autolink(renderContent(s.content))+renderRefs(id);",
                    "+applyDetails(id,autolink(renderContent(s.content)))+renderRefs(id);", 1)
    open(p,'w',encoding='utf-8').write(c)
    print(f"  {slug}: refs={nrefs}, details={ndet}, {len(c)//1024}KB")

def find_matching_close(c, start):
    # start at index of '<div'; return index just after matching '</div>'
    i=start; depth=0
    for m in re.finditer(r'<div\b|</div>', c[start:]):
        if m.group(0)=='<div': depth+=1
        else:
            depth-=1
            if depth==0: return start+m.end()
    return -1

def luat67_box(refs_list):
    h='<!--XREF-START-->\n<div class="refbox"><div class="refhead">🔗 Hướng dẫn / Liên kết liên quan</div>\n'
    for r in refs_list:
        if r.get('targetSlug'):
            href='/legal/'+r['targetSlug']+('?anchor='+r['targetAnchor'] if r.get('targetAnchor') else '')
            h+=f'<a class="refrow {r.get("kind","")}" target="_top" href="{href}">{esc(r["label"])} →</a>\n'
        else:
            h+=f'<div class="refrow note">{esc(r["label"])}{(" "+esc(r["note"])) if r.get("note") else ""}</div>\n'
    return h+'</div>\n<!--XREF-END-->\n'

def luat67_detail_js():
    data=json.dumps(DETAILS.get('luat-67', {}), ensure_ascii=False, separators=(',',':'))
    esc='function __cdEsc(s){return String(s||"").replace(/[&<>"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"})[c];});}'
    body=cd_js('__cdEsc').replace('/*CD-JS-START*/','').replace('/*CD-JS-END*/','').strip()
    return ('<!--CD-LUAT-JS-START--><script>\nwindow.__CDD__='+data+';\n'+esc+'\n'+body+'\n</script><!--CD-LUAT-JS-END-->\n')

def wrap_luat67_details(c):
    det=DETAILS.get('luat-67', {})
    cnt=0
    for anchor, arr in det.items():
        m=re.search(r'id="'+re.escape(anchor)+r'"', c)
        if not m:
            print(f"   luat-67: detail anchor {anchor} not found"); continue
        ds=c.rfind('<div', 0, m.start())
        close=find_matching_close(c, ds)
        if close<0: continue
        seg=c[ds:close]
        for ix, e in enumerate(arr):
            mt=e.get('match')
            if not mt: continue
            if mt not in seg:
                print(f"   luat-67: match not found in {anchor}: {mt[:40]}…"); continue
            wrap=('<span class="clause-hl" onclick="openDetail(\''+anchor+'\','+str(ix)+');return false">'
                  +mt+'<span class="cd-ico">ⓘ</span></span>')
            seg=seg.replace(mt, wrap, 1); cnt+=1
        c=c[:ds]+seg+c[close:]
    return c, cnt

def patch_luat67():
    p=os.path.join(DOCS, 'luat-67', 'index.html')
    c=open(p, encoding='utf-8').read()
    c=strip_blocks(c)
    c=c.replace('</style>', css(False)+cd_css(False)+'</style>', 1)
    # clause-detail: static highlights + modal + data/helpers script
    c, ndet=wrap_luat67_details(c)
    c=insert_modal(c)
    c=c.replace('</body>', luat67_detail_js()+'</body>', 1)
    refs=REFS.get('luat-67', {})
    cnt=0
    # insert box before closing div of each <div id="sec-X" class="section">
    for anchor, lst in refs.items():
        sid='sec-'+anchor
        m=re.search(r'<div id="'+re.escape(sid)+r'"[^>]*class="section"', c)
        if not m:
            print(f"   luat-67: section {sid} not found"); continue
        close=find_matching_close(c, m.start())
        if close<0: continue
        box=luat67_box(lst)
        # insert before the final </div> (close-7 .. close is '</div>')
        ins=close-len('</div>')
        c=c[:ins]+box+c[ins:]
        cnt+=1
    open(p,'w',encoding='utf-8').write(c)
    print(f"  luat-67: {cnt} sections, details={ndet}, {len(c)//1024}KB")

print("Injecting cross-references...")
patch_json_app('tt58',  dark=False, escaper='e',   nav='show',        before_func='function show(')
patch_json_app('tt152', dark=False, escaper='e',   nav='show',        before_func='function show(')
patch_json_app('tt133', dark=True,  escaper='e',   nav='show',        before_func='function renderContent')
patch_json_app('nd320', dark=False, escaper='e',   nav='show',        before_func='function renderContent')
patch_json_app('tt20',  dark=False, escaper='e',   nav='show',        before_func='function renderContent')
patch_json_app('tt99',  dark=True,  escaper='esc', nav='showSection', before_func='function showSection(')
patch_luat67()
# ===== Chum thuế GTGT / TNCN / Quản lý thuế (generator docx-to-legal.py, họ 'show') =====
for _slug in ('luat-48','luat-149','luat-109','luat-09','luat-108','luat-38',
              'nd181','nd68','nd144','nd359','tt69','tt18',
              'luat-66','nd360','tt158',
              'nd134','nd18','nd182','tt06','tt39',
              # Lao động / BHXH / Công đoàn
              'blld-45','luat-74','luat-41','luat-25','luat-50',
              'nd145','nd293','nd191','nd105','qd595','qd505',
              # Hóa đơn / Chứng từ
              'nd123','nd70','nd254',
              # Chuyển giá / Doanh nghiệp / Nghị quyết
              'nd253','nd132','luat-59','nq110',
              # Quản lý thuế — bổ sung
              'nd20','nd252','tt87',
              # Quản lý thuế / TNDN / TNCN / TTĐB / Nhà thầu / XNK — bổ sung 2026-07
              'nd126','nd91','tt80','tt103','luat03','luat-107',
              # Đợt bổ sung 2026-07 (Tổng hợp 2)
              'nd255','nd273','tt90','tt21','tt74','tt85','tt86','tt91','tt94','tt96','tt97','cv2927'):
    patch_json_app(_slug, dark=False, escaper='e', nav='show', before_func='function show(')
print("Done.")
