import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { getDocBySlug } from '@/lib/legal/registry'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function buildLockScript(plans: { id: string; name: string; duration_months: number; price: number; original_price: number | null }[]) {
  const plansJson = JSON.stringify(plans).replace(/<\/script>/gi, '<\\/script>')

  return `<script>
(function(){
  var PLANS=${plansJson};

  /* ── 1. CSS injection — live selectors, no timing/MutationObserver needed ── */
  var _css=document.createElement('style');
  _css.textContent=[
    /* Dim ALL external links (target=_top covers refrow + cd-link across all doc types) */
    'a[target="_top"],a.dl-btn,a[href*="/api/legal/forms"]{opacity:.45!important;cursor:not-allowed!important;pointer-events:auto!important}',
    /* Lock badge on every refbox header via CSS pseudo-element */
    '.refbox .refhead::after{content:" 🔒";font-size:12px;color:#f59e0b}',
    /* Restore normal style inside upsell modal itself */
    '#kk-upsell a{opacity:1!important;cursor:pointer!important;pointer-events:auto!important}',
    /* Plan cards hover */
    '.kk-plan-card{display:block;padding:12px 14px;border:1.5px solid #3b82f6;border-radius:10px;text-decoration:none;color:inherit;background:#eff6ff;transition:.12s}',
    '.kk-plan-card:hover{background:#dbeafe}',
  ].join('');
  (document.head||document.documentElement).appendChild(_css);

  /* ── 2. Upsell modal ── */
  var _modal=null;
  function fmtPrice(n){return n.toLocaleString('vi-VN')+'₫';}
  function fmtDur(m){return m===1?'1 tháng':m===12?'1 năm':m+' tháng';}
  function showUpsell(){
    if(_modal){_modal.style.display='flex';return;}
    var cards='';
    PLANS.forEach(function(p){
      cards+='<a href="/cart?legal_plan='+p.id+'" target="_top" class="kk-plan-card">'
        +'<div style="font-weight:700;font-size:13px;color:#1e40af">'+p.name+' — '+fmtDur(p.duration_months)+'</div>'
        +'<div style="font-size:18px;font-weight:800;color:#2563eb;margin-top:4px">'+fmtPrice(p.price)+'</div>'
        +'</a>';
    });
    if(!cards) cards='<p style="color:#6b7280;font-size:13px">Hiện chưa có gói nào. Vui lòng quay lại sau.</p>';
    var el=document.createElement('div');
    el.id='kk-upsell';
    el.style.cssText='position:fixed;inset:0;background:rgba(8,12,28,.6);display:flex;align-items:center;justify-content:center;z-index:999999;padding:18px;';
    el.innerHTML='<div style="background:#fff;color:#0f172a;max-width:440px;width:100%;border-radius:16px;padding:24px 24px 20px;box-shadow:0 24px 64px rgba(0,0,0,.4);position:relative">'
      +'<button id="kk-close-btn" style="position:absolute;top:10px;right:14px;border:0;background:transparent;font-size:22px;cursor:pointer;color:#64748b">×</button>'
      +'<div style="font-size:15px;font-weight:800;color:#1e40af;margin-bottom:4px">🔒 Tính năng cao cấp</div>'
      +'<div style="font-size:13px;color:#475569;margin-bottom:16px">Mua gói Pháp luật để xem tham chiếu chéo, tải biểu mẫu và nhiều hơn nữa.</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px">'+cards+'</div>'
      +'<div style="margin-top:14px;text-align:center"><a href="/packages" target="_top" style="font-size:12px;color:#2563eb">Xem tất cả gói →</a></div>'
      +'</div>';
    el.addEventListener('click',function(e){
      if(e.target===el||e.target.id==='kk-close-btn') el.style.display='none';
    });
    document.body.appendChild(el);
    _modal=el;
  }

  /* ── 3. Single capture-phase delegation — catches every click regardless of timing ── */
  document.addEventListener('click',function(e){
    /* Allow clicks inside the upsell modal itself (e.g. "Xem gói" links) */
    if(e.target.closest&&e.target.closest('#kk-upsell')) return;
    var el=e.target.closest
      ?e.target.closest('a[target="_top"],a.dl-btn,a[href*="/api/legal/forms"]')
      :null;
    if(el){e.preventDefault();e.stopPropagation();showUpsell();}
  },true);

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
      .select('id, name, duration_months, price, original_price')
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
