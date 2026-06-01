#!/usr/bin/env python3
# Inject article-level cross-references vào các app HTML (idempotent).
# Nguồn: src/lib/legal/cross-refs.json. Chạy lại an toàn nhiều lần.
import json, re, os, html as htmllib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'src/legal-docs')
REFS = json.load(open(os.path.join(ROOT, 'src/lib/legal/cross-refs.json'), encoding='utf-8'))

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

def strip_blocks(c):
    c=re.sub(r'/\*XREF-CSS-START\*/.*?/\*XREF-CSS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'/\*XREF-JS-START\*/.*?/\*XREF-JS-END\*/\n?', '', c, flags=re.DOTALL)
    c=re.sub(r'<!--XREF-START-->.*?<!--XREF-END-->\n?', '', c, flags=re.DOTALL)
    return c

def set_refs_in_json(c, slug):
    m=re.search(r'(<script id="(?:LD|DATA)" type="application/json">)(.*?)(</script>)', c, re.DOTALL)
    if not m: return c, 0
    data=json.loads(m.group(2))
    data['refs']=REFS.get(slug, {})
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
        c=c.replace("  document.getElementById('av').innerHTML=h;",
                    "  h+=renderRefs(id);\n  document.getElementById('av').innerHTML=h;", 1)
    elif slug=='tt133':
        c=c.replace("+renderContent(a.content||[],q)+'</div>';",
                    "+renderContent(a.content||[],q)+'</div>'+renderRefs(id);")
        c=c.replace("return h||'<p style=\"color:var(--mut)\">(Mục này không có nội dung văn bản.)</p>';",
                    "return autolink(h||'<p style=\"color:var(--mut)\">(Mục này không có nội dung văn bản.)</p>');")
    elif slug=='tt99':
        c=c.replace("+renderContent(s.content);", "+autolink(renderContent(s.content))+renderRefs(id);")
    open(p,'w',encoding='utf-8').write(c)
    print(f"  {slug}: refs={nrefs}, {len(c)//1024}KB")

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

def patch_luat67():
    p=os.path.join(DOCS, 'luat-67', 'index.html')
    c=open(p, encoding='utf-8').read()
    c=strip_blocks(c)
    c=c.replace('</style>', css(False)+'</style>', 1)
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
    print(f"  luat-67: {cnt} sections, {len(c)//1024}KB")

print("Injecting cross-references...")
patch_json_app('tt58',  dark=False, escaper='e',   nav='show',        before_func='function show(')
patch_json_app('tt152', dark=False, escaper='e',   nav='show',        before_func='function show(')
patch_json_app('tt133', dark=True,  escaper='e',   nav='show',        before_func='function renderContent')
patch_json_app('tt99',  dark=True,  escaper='esc', nav='showSection', before_func='function showSection(')
patch_luat67()
print("Done.")
