import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { getDocBySlug } from '@/lib/legal/registry'
import { createAdminClient } from '@/lib/supabase/server'

function buildLockScript(plans: { name: string; duration_months: number; price: number }[]) {
  const plansJson = JSON.stringify(plans)

  return `<script>
(function(){
  var PLANS=${plansJson};

  /* ── Upsell modal ── */
  var _modal=null;
  function fmtPrice(n){return n.toLocaleString('vi-VN')+'₫';}
  function fmtDur(m){return m===1?'1 tháng':m===12?'1 năm':m+' tháng';}
  function showUpsell(){
    if(_modal){_modal.style.display='flex';return;}
    var cards='';
    PLANS.forEach(function(p){
      cards+='<a href="/packages" target="_top" style="display:block;padding:12px 14px;border:1.5px solid #3b82f6;border-radius:10px;text-decoration:none;color:inherit;background:#eff6ff;transition:.12s" onmouseover="this.style.background=\'#dbeafe\'" onmouseout="this.style.background=\'#eff6ff\'">'
        +'<div style="font-weight:700;font-size:13px;color:#1e40af">'+p.name+' — '+fmtDur(p.duration_months)+'</div>'
        +'<div style="font-size:18px;font-weight:800;color:#2563eb;margin-top:4px">'+fmtPrice(p.price)+'</div>'
        +'</a>';
    });
    if(!cards) cards='<p style="color:#6b7280;font-size:13px">Hiện chưa có gói nào. Vui lòng quay lại sau.</p>';
    var el=document.createElement('div');
    el.id='kk-upsell';
    el.style.cssText='position:fixed;inset:0;background:rgba(8,12,28,.6);display:flex;align-items:center;justify-content:center;z-index:999999;padding:18px;';
    el.innerHTML='<div style="background:#fff;color:#0f172a;max-width:440px;width:100%;border-radius:16px;padding:24px 24px 20px;box-shadow:0 24px 64px rgba(0,0,0,.4);position:relative">'
      +'<button onclick="document.getElementById(\'kk-upsell\').style.display=\'none\'" style="position:absolute;top:10px;right:14px;border:0;background:transparent;font-size:22px;cursor:pointer;color:#64748b">×</button>'
      +'<div style="font-size:15px;font-weight:800;color:#1e40af;margin-bottom:4px">🔒 Tính năng cao cấp</div>'
      +'<div style="font-size:13px;color:#475569;margin-bottom:16px">Mua gói Pháp luật để xem tham chiếu chéo, tải biểu mẫu và nhiều hơn nữa.</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px">'+cards+'</div>'
      +'<div style="margin-top:14px;text-align:center"><a href="/packages" target="_top" style="font-size:12px;color:#2563eb">Xem tất cả gói →</a></div>'
      +'</div>';
    el.addEventListener('click',function(e){if(e.target===el)el.style.display='none';});
    document.body.appendChild(el);
    _modal=el;
  }

  function lockEl(el){
    if(el.dataset.locked) return;
    el.dataset.locked='1';
    el.removeAttribute('href');
    el.style.opacity='0.5';
    el.style.cursor='not-allowed';
    el.style.pointerEvents='auto';
    el.title='Mua gói Pháp luật để dùng tính năng này';
    el.addEventListener('click',function(e){ e.preventDefault(); showUpsell(); });
  }

  function lock(){
    document.querySelectorAll('a[href*="/api/legal/forms"]').forEach(function(el){ lockEl(el); });
    document.querySelectorAll('.refrow').forEach(function(el){ lockEl(el); });
    document.querySelectorAll('.refbox').forEach(function(box){
      if(box.dataset.locked) return;
      box.dataset.locked='1';
      var head=box.querySelector('.refhead');
      if(head && !head.querySelector('.lock-badge')){
        var b=document.createElement('span');
        b.style.cssText='font-size:11px;color:#f59e0b;margin-left:6px;font-weight:600;';
        b.textContent='🔒 Yêu cầu gói Pháp luật';
        head.appendChild(b);
      }
    });
    document.querySelectorAll('a.cd-link[href]').forEach(function(el){ lockEl(el); });
  }

  function hookOpenDetail(){
    if(typeof openDetail!=='function'||openDetail.__locked) return;
    var orig=openDetail;
    openDetail=function(id,ix){
      orig(id,ix);
      var c=document.getElementById('cdLinks');
      if(c) c.querySelectorAll('a.cd-link').forEach(function(el){ lockEl(el); });
    };
    openDetail.__locked=true;
  }

  document.addEventListener('DOMContentLoaded',function(){ lock(); hookOpenDetail(); });
  new MutationObserver(function(){ lock(); hookOpenDetail(); })
    .observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`
}

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
    const admin = createAdminClient()
    const { data: plans } = await admin
      .from('legal_plans')
      .select('name, duration_months, price')
      .eq('is_active', true)
      .order('price', { ascending: true })

    const lockScript = buildLockScript(plans ?? [])
    html = html.includes('</body>')
      ? html.replace('</body>', lockScript + '</body>')
      : html + lockScript
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  })
}
