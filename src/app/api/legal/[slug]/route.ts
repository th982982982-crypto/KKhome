import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { getDocBySlug } from '@/lib/legal/registry'

// Injected vào iframe khi user chưa mua gói — khóa form download links
const FORMS_LOCK_SCRIPT = `<script>
(function(){
  function lock(){
    document.querySelectorAll('a[href*="/api/legal/forms"]').forEach(function(el){
      if(el.dataset.locked) return;
      el.dataset.locked='1';
      el.removeAttribute('href');
      el.style.opacity='0.45';
      el.style.cursor='not-allowed';
      el.title='Mua gói Pháp luật để tải biểu mẫu';
      el.addEventListener('click',function(e){
        e.preventDefault();
        window.open('/packages','_blank');
      });
    });
  }
  document.addEventListener('DOMContentLoaded',lock);
  new MutationObserver(lock).observe(document.documentElement,{childList:true,subtree:true});
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
