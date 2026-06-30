import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { getDocBySlug } from '@/lib/legal/registry'

// Injected vào iframe khi user chưa mua gói — khóa form download, refrow và popup cd-link
const FORMS_LOCK_SCRIPT = `<script>
(function(){
  function lockEl(el,msg){
    if(el.dataset.locked) return;
    el.dataset.locked='1';
    el.removeAttribute('href');
    el.style.opacity='0.5';
    el.style.cursor='not-allowed';
    el.style.pointerEvents='auto';
    el.title=msg||'Mua gói Pháp luật để dùng liên kết';
    el.addEventListener('click',function(e){ e.preventDefault(); window.open('/packages','_blank'); });
  }

  function lock(){
    // Nút tải biểu mẫu
    document.querySelectorAll('a[href*="/api/legal/forms"]').forEach(function(el){
      lockEl(el,'Mua gói Pháp luật để tải biểu mẫu');
    });
    // Link tham chiếu chéo inline (refbox)
    document.querySelectorAll('.refrow').forEach(function(el){ lockEl(el); });
    // Badge trên refbox header
    document.querySelectorAll('.refbox').forEach(function(box){
      if(box.dataset.locked) return;
      box.dataset.locked='1';
      var head=box.querySelector('.refhead');
      if(head && !head.querySelector('.lock-badge')){
        var b=document.createElement('span');
        b.className='lock-badge';
        b.style.cssText='font-size:11px;color:#f59e0b;margin-left:6px;font-weight:600;';
        b.textContent='🔒 Yêu cầu gói Pháp luật';
        head.appendChild(b);
      }
    });
    // Link trong popup cd-card (cd-link)
    document.querySelectorAll('a.cd-link[href]').forEach(function(el){ lockEl(el); });
  }

  // Override openDetail để lock link ngay khi popup mở
  function hookOpenDetail(){
    if(typeof openDetail!=='function') return;
    if(openDetail.__locked) return;
    var orig=openDetail;
    openDetail=function(id,ix){
      orig(id,ix);
      var container=document.getElementById('cdLinks');
      if(container) container.querySelectorAll('a.cd-link').forEach(function(el){ lockEl(el); });
    };
    openDetail.__locked=true;
  }

  document.addEventListener('DOMContentLoaded',function(){ lock(); hookOpenDetail(); });
  new MutationObserver(function(){ lock(); hookOpenDetail(); })
    .observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const doc = getDocBySlug(slug)
  if (!doc) return new NextResponse('Not Found', { status: 404 })

  let html = await readFile(doc.filePath, 'utf-8')

  const access = await checkLegalAccess()
  if (!access.allowed) {
    // Inject lock script — form download buttons sẽ bị disable, click sẽ mở /packages
    html = html.includes('</body>')
      ? html.replace('</body>', FORMS_LOCK_SCRIPT + '</body>')
      : html + FORMS_LOCK_SCRIPT
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  })
}
